import os
import csv
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
                             QPushButton, QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox, 
                             QGroupBox, QDateEdit, QCompleter, QCheckBox, QFileDialog, QAbstractItemView)
from PyQt6.QtCore import QDate, Qt, QStringListModel
from PyQt6.QtGui import QDoubleValidator

from database import Session, Purchase, PurchaseItem, Inventory, Item
from sqlalchemy import func

class PurchaseTab(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_history()
        self.update_completers()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        # --- 1. New Purchase / Stock Entry Group ---
        group_new = QGroupBox("Add New Stock / Purchase")
        layout_new = QVBoxLayout()

        # Top tools inside group: Bulk Excel Options
        bulk_tools = QHBoxLayout()
        bulk_tools.addStretch()
        btn_sample_excel = QPushButton("📥 Purchase Sample Excel")
        btn_sample_excel.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; padding: 6px 12px; border-radius: 6px;")
        btn_sample_excel.clicked.connect(self.download_sample_excel)

        btn_import_excel = QPushButton("📤 Import Bulk Purchase (Excel)")
        btn_import_excel.setStyleSheet("background-color: #10b981; color: white; font-weight: bold; padding: 6px 12px; border-radius: 6px;")
        btn_import_excel.clicked.connect(self.import_bulk_purchase_excel)

        bulk_tools.addWidget(btn_sample_excel)
        bulk_tools.addWidget(btn_import_excel)
        layout_new.addLayout(bulk_tools)

        # Single Item Entry Form
        form = QHBoxLayout()

        self.p_code = QLineEdit()
        self.p_code.setPlaceholderText("Code (1-100)")
        self.p_code.setFixedWidth(90)
        self.code_completer = QCompleter()
        self.code_completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.code_completer.setFilterMode(Qt.MatchFlag.MatchContains)
        self.p_code.setCompleter(self.code_completer)
        self.code_completer.activated.connect(self.fill_by_code)
        self.p_code.returnPressed.connect(self.fill_by_code)

        self.p_item = QLineEdit()
        self.p_item.setPlaceholderText("Item Name (Auto-fills)")
        self.item_completer = QCompleter()
        self.item_completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.item_completer.setFilterMode(Qt.MatchFlag.MatchContains)
        self.p_item.setCompleter(self.item_completer)
        self.item_completer.activated.connect(self.fill_by_name)
        self.p_item.returnPressed.connect(self.fill_by_name)

        self.qty_label = QLabel("Qty:")
        self.p_qty = QLineEdit()
        self.p_qty.setPlaceholderText("e.g. 0.5, 1")
        self.p_qty.setFixedWidth(80)
        self.p_qty.setValidator(QDoubleValidator(0.001, 999999.0, 3))

        self.p_cost = QLineEdit()
        self.p_cost.setPlaceholderText("Cost Price")
        self.p_cost.setFixedWidth(85)
        self.p_cost.setValidator(QDoubleValidator(0.0, 999999.0, 2))

        self.p_mrp = QLineEdit()
        self.p_mrp.setPlaceholderText("MRP")
        self.p_mrp.setFixedWidth(85)
        self.p_mrp.setValidator(QDoubleValidator(0.0, 999999.0, 2))

        self.chk_track_inventory = QCheckBox("Add to Inventory")
        self.chk_track_inventory.setChecked(True)
        self.chk_track_inventory.setToolTip("If checked, updates/adds this stock to the real-time Inventory tab.")

        add_btn = QPushButton("Add to Purchase")
        add_btn.setStyleSheet("background-color: #10b981; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        add_btn.clicked.connect(self.save_purchase)

        form.addWidget(QLabel("Code:")); form.addWidget(self.p_code)
        form.addWidget(QLabel("Item:")); form.addWidget(self.p_item)
        form.addWidget(self.qty_label); form.addWidget(self.p_qty)
        form.addWidget(QLabel("Cost:")); form.addWidget(self.p_cost)
        form.addWidget(QLabel("MRP:")); form.addWidget(self.p_mrp)
        form.addWidget(self.chk_track_inventory)
        form.addWidget(add_btn)

        layout_new.addLayout(form)
        group_new.setLayout(layout_new)
        layout.addWidget(group_new)

        # --- 2. Purchase History Group ---
        group_hist = QGroupBox("Purchase History")
        layout_hist = QVBoxLayout()

        filter_layout = QHBoxLayout()
        self.date_filter = QDateEdit()
        self.date_filter.setCalendarPopup(True)
        self.date_filter.setDate(QDate.currentDate())
        btn_filter = QPushButton("Filter Date")
        btn_filter.clicked.connect(self.load_history)

        filter_layout.addWidget(QLabel("Date:"))
        filter_layout.addWidget(self.date_filter)
        filter_layout.addWidget(btn_filter)
        filter_layout.addStretch()
        layout_hist.addLayout(filter_layout)

        self.table_hist = QTableWidget()
        self.table_hist.setColumnCount(8)
        self.table_hist.setHorizontalHeaderLabels(["ID", "Date", "Code", "Item Name", "Qty", "Cost", "MRP", "In Stock?"])
        self.table_hist.hideColumn(0)
        self.table_hist.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        self.table_hist.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table_hist.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.table_hist.doubleClicked.connect(self.edit_history_item)

        layout_hist.addWidget(self.table_hist)

        btn_del = QPushButton("Delete Selected Purchase")
        btn_del.setStyleSheet("background-color: #ef4444; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        btn_del.clicked.connect(self.delete_history_item)
        layout_hist.addWidget(btn_del)

        group_hist.setLayout(layout_hist)
        layout.addWidget(group_hist)

    def showEvent(self, event):
        super().showEvent(event)
        self.update_completers()
        self.load_history()

    def update_completers(self):
        """Refreshes the suggestion list from Item Master and Inventory"""
        session = Session()
        items = session.query(Item).all()
        codes = [str(i.item_code) for i in items if i.item_code]
        names = [i.name for i in items if i.name]

        # Also add any existing inventory item names
        inv_items = session.query(Inventory.item_name).distinct().all()
        for iv in inv_items:
            if iv[0] and iv[0] not in names:
                names.append(iv[0])

        self.code_completer.setModel(QStringListModel(codes))
        self.item_completer.setModel(QStringListModel(names))
        session.close()

    def fill_by_code(self):
        """Auto-fills Item Name, MRP, and unit based on entered Item Code"""
        code = self.p_code.text().strip()
        if not code: return

        session = Session()
        item = session.query(Item).filter_by(item_code=code).first()
        if item:
            self.p_item.setText(item.name)
            self.p_mrp.setText(str(item.mrp))
            unit = item.qty_type or "piece"
            self.qty_label.setText(f"Qty ({unit}):")
            
            # Check latest cost price from purchases or inventory
            latest_pi = session.query(PurchaseItem).filter(
                (PurchaseItem.item_code == code) | (func.lower(PurchaseItem.item_name) == item.name.lower())
            ).order_by(PurchaseItem.id.desc()).first()

            if latest_pi and latest_pi.cost_price > 0:
                self.p_cost.setText(str(latest_pi.cost_price))
            else:
                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == item.name.lower()).first()
                if inv and inv.cost_price > 0:
                    self.p_cost.setText(str(inv.cost_price))

            self.p_qty.setFocus()
            self.p_qty.selectAll()
        session.close()

    def fill_by_name(self):
        """Auto-fills Code, MRP, and unit based on entered Item Name"""
        name = self.p_item.text().strip()
        if not name: return

        session = Session()
        item = session.query(Item).filter(func.lower(Item.name) == name.lower()).first()
        if item:
            self.p_code.setText(str(item.item_code))
            self.p_mrp.setText(str(item.mrp))
            unit = item.qty_type or "piece"
            self.qty_label.setText(f"Qty ({unit}):")
            
            latest_pi = session.query(PurchaseItem).filter(
                (PurchaseItem.item_code == item.item_code) | (func.lower(PurchaseItem.item_name) == item.name.lower())
            ).order_by(PurchaseItem.id.desc()).first()

            if latest_pi and latest_pi.cost_price > 0:
                self.p_cost.setText(str(latest_pi.cost_price))
            else:
                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == item.name.lower()).first()
                if inv and inv.cost_price > 0:
                    self.p_cost.setText(str(inv.cost_price))

            self.p_qty.setFocus()
            self.p_qty.selectAll()
        else:
            # Check inventory fallback
            inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).first()
            if inv:
                if inv.item_code: self.p_code.setText(str(inv.item_code))
                self.p_mrp.setText(str(inv.mrp))
                self.p_cost.setText(str(inv.cost_price))
                if inv.qty_type: self.qty_label.setText(f"Qty ({inv.qty_type}):")
                self.p_qty.setFocus()
        session.close()

    def save_purchase(self):
        session = Session()
        try:
            code = self.p_code.text().strip()
            name = self.p_item.text().strip().title()
            qty_str = self.p_qty.text().strip()
            cost_str = self.p_cost.text().strip()
            mrp_str = self.p_mrp.text().strip()
            track_stock = self.chk_track_inventory.isChecked()

            if not name:
                QMessageBox.warning(self, "Error", "Item Name is required.")
                return

            try:
                qty = float(qty_str)
                cost = float(cost_str) if cost_str else 0.0
                mrp = float(mrp_str) if mrp_str else 0.0
            except ValueError:
                QMessageBox.warning(self, "Error", "Invalid numeric values for Qty, Cost, or MRP.")
                return

            if qty <= 0:
                QMessageBox.warning(self, "Error", "Quantity must be greater than zero.")
                return

            # Lookup unit from Item master
            unit = "piece"
            item_master = None
            if code:
                item_master = session.query(Item).filter_by(item_code=code).first()
            if not item_master:
                item_master = session.query(Item).filter(func.lower(Item.name) == name.lower()).first()
            if item_master:
                unit = item_master.qty_type or "piece"
                if not code:
                    code = str(item_master.item_code)

            today = datetime.now().date()
            # Check if matching purchase exists today for merging
            existing_item = session.query(PurchaseItem).join(Purchase).filter(
                func.date(Purchase.date_time) == today,
                func.lower(PurchaseItem.item_name) == name.lower(),
                PurchaseItem.cost_price == cost,
                PurchaseItem.mrp == mrp,
                PurchaseItem.track_item == track_stock
            ).first()

            amt = qty * cost

            if existing_item:
                existing_item.quantity += qty
                existing_item.amount = existing_item.quantity * cost
                existing_item.purchase.total_amount += amt
                if code: existing_item.item_code = code
                msg = f"Stock merged: Added {qty:g} {unit} to existing purchase entry."
            else:
                purch = Purchase(total_amount=amt, date_time=datetime.now(), category="Stock", track_item=track_stock)
                session.add(purch)
                session.flush()

                p_item = PurchaseItem(
                    purchase_id=purch.id,
                    item_code=code,
                    item_name=name,
                    quantity=qty,
                    cost_price=cost,
                    mrp=mrp,
                    amount=amt,
                    qty_type=unit,
                    track_item=track_stock
                )
                session.add(p_item)
                msg = f"Purchase saved: {name} (Qty: {qty:g} {unit})."

            # Update Inventory if track_stock is enabled
            if track_stock:
                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).first()
                if inv:
                    inv.quantity += qty
                    inv.cost_price = cost
                    if mrp > 0: inv.mrp = mrp
                    if code: inv.item_code = code
                    if unit: inv.qty_type = unit
                else:
                    inv = Inventory(
                        item_code=code,
                        item_name=name,
                        quantity=qty,
                        cost_price=cost,
                        mrp=mrp,
                        qty_type=unit
                    )
                    session.add(inv)
                msg += "\nInventory stock updated."
            else:
                msg += "\n(Not added to inventory as tracking was unchecked)."

            session.commit()
            QMessageBox.information(self, "Success", msg)

            self.p_code.clear()
            self.p_item.clear()
            self.p_qty.clear()
            self.p_cost.clear()
            self.p_mrp.clear()
            self.qty_label.setText("Qty:")

            self.load_history()
            self.update_completers()

        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

    def edit_history_item(self, index):
        row = index.row()
        item_id = self.table_hist.item(row, 0).text()

        session = Session()
        item = session.query(PurchaseItem).filter_by(id=item_id).first()

        if item:
            self.p_code.setText(item.item_code or "")
            self.p_item.setText(item.item_name)
            self.p_qty.setText(f"{item.quantity:g}")
            self.p_cost.setText(str(item.cost_price))
            self.p_mrp.setText(str(item.mrp))
            self.chk_track_inventory.setChecked(bool(item.track_item))
            if item.qty_type:
                self.qty_label.setText(f"Qty ({item.qty_type}):")

            # Revert inventory if it was tracked
            if item.track_item:
                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == item.item_name.lower()).first()
                if inv:
                    inv.quantity -= item.quantity
                    if inv.quantity <= 0:
                        session.delete(inv)

            count = session.query(PurchaseItem).filter_by(purchase_id=item.purchase_id).count()
            if count <= 1:
                session.query(Purchase).filter_by(id=item.purchase_id).delete()
            else:
                parent = session.query(Purchase).filter_by(id=item.purchase_id).first()
                if parent: parent.total_amount -= item.amount

            session.delete(item)
            session.commit()

            self.load_history()
            self.update_completers()
            self.p_qty.setFocus()

        session.close()

    def delete_history_item(self):
        row = self.table_hist.currentRow()
        if row == -1: return

        if QMessageBox.question(self, "Confirm", "Delete this purchase entry? (Tracked stock will be reduced)") == QMessageBox.StandardButton.Yes:
            pid = self.table_hist.item(row, 0).text()
            session = Session()
            item = session.query(PurchaseItem).filter_by(id=pid).first()
            if item:
                if item.track_item:
                    inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == item.item_name.lower()).first()
                    if inv:
                        inv.quantity -= item.quantity
                        if inv.quantity <= 0:
                            session.delete(inv)

                count = session.query(PurchaseItem).filter_by(purchase_id=item.purchase_id).count()
                if count <= 1:
                    session.query(Purchase).filter_by(id=item.purchase_id).delete()
                else:
                    parent = session.query(Purchase).filter_by(id=item.purchase_id).first()
                    if parent: parent.total_amount -= item.amount

                session.delete(item)
                session.commit()

            session.close()
            self.load_history()
            self.update_completers()

    def load_history(self):
        session = Session()
        dt = self.date_filter.date().toPyDate()
        items = session.query(PurchaseItem).join(Purchase).filter(func.date(Purchase.date_time) == dt).order_by(PurchaseItem.id.desc()).all()

        self.table_hist.setRowCount(0)
        for i in items:
            r = self.table_hist.rowCount()
            self.table_hist.insertRow(r)
            self.table_hist.setItem(r, 0, QTableWidgetItem(str(i.id)))
            self.table_hist.setItem(r, 1, QTableWidgetItem(i.purchase.date_time.strftime("%d-%m-%Y %H:%M")))
            self.table_hist.setItem(r, 2, QTableWidgetItem(str(i.item_code or "")))
            self.table_hist.setItem(r, 3, QTableWidgetItem(i.item_name))

            unit = i.qty_type or ""
            qty_display = f"{i.quantity:g} {unit}".strip()
            self.table_hist.setItem(r, 4, QTableWidgetItem(qty_display))
            self.table_hist.setItem(r, 5, QTableWidgetItem(f"{i.cost_price:.2f}"))
            self.table_hist.setItem(r, 6, QTableWidgetItem(f"{i.mrp:.2f}"))

            stock_item = QTableWidgetItem("Yes" if i.track_item else "No")
            if i.track_item: stock_item.setForeground(Qt.GlobalColor.darkGreen)
            else: stock_item.setForeground(Qt.GlobalColor.darkGray)
            self.table_hist.setItem(r, 7, stock_item)

        session.close()

    def download_sample_excel(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save Purchase Sample Excel", "Sample_Bulk_Purchase.xlsx", "Excel Files (*.xlsx);;CSV Files (*.csv)")
        if not path: return

        sample_rows = [
            ["1", 10.0, 38.0, 45.0, "yes"],
            ["2", 25.5, 75.0, 95.0, "yes"],
            ["3", 12.0, 115.0, 140.0, "yes"],
            ["4", 50.0, 48.0, 58.0, "yes"],
            ["5", 5.0, 18.0, 25.0, "no"]
        ]

        if path.lower().endswith(".csv"):
            try:
                with open(path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["item_code", "quantity", "cost_price", "mrp", "track_inventory"])
                    for row in sample_rows: writer.writerow(row)
                QMessageBox.information(self, "Success", f"Sample CSV saved to:\n{path}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed: {e}")
            return

        try:
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Bulk Purchase"

            header_fill = PatternFill(start_color="107C10", end_color="107C10", fill_type="solid")
            header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

            headers = ["item_code", "quantity", "cost_price", "mrp", "track_inventory"]
            ws.append(headers)

            for col_num in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_num)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")

            for row in sample_rows: ws.append(row)

            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = openpyxl.utils.get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 4, 15)

            wb.save(path)
            QMessageBox.information(self, "Success", f"Sample Bulk Purchase Excel saved at:\n{path}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to save Excel file: {e}")

    def import_bulk_purchase_excel(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Bulk Purchase Excel/CSV", "", "Spreadsheets (*.xlsx *.xls *.csv)")
        if not file_path: return

        rows = []
        is_csv = file_path.lower().endswith(".csv")

        try:
            if is_csv:
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    for r in reader:
                        if r: rows.append([c.strip() for c in r])
            else:
                wb = openpyxl.load_workbook(file_path, data_only=True)
                ws = wb.active
                for row in ws.iter_rows(values_only=True):
                    if any(row):
                        rows.append([str(c).strip() if c is not None else "" for c in row])
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to read file:\n{e}")
            return

        if len(rows) < 2:
            QMessageBox.warning(self, "Warning", "Excel file has no data rows.")
            return

        headers = [h.lower().replace(" ", "").replace("_", "").replace(".", "") for h in rows[0]]
        code_idx = -1; qty_idx = -1; cost_idx = -1; mrp_idx = -1; track_idx = -1

        for idx, h in enumerate(headers):
            if "code" in h: code_idx = idx
            elif "qty" in h or "quantity" in h: qty_idx = idx
            elif "cost" in h: cost_idx = idx
            elif "mrp" in h or "sell" in h or "price" in h: mrp_idx = idx
            elif "track" in h or "inventory" in h: track_idx = idx

        if code_idx == -1 and len(headers) > 0: code_idx = 0
        if qty_idx == -1 and len(headers) > 1: qty_idx = 1
        if cost_idx == -1 and len(headers) > 2: cost_idx = 2
        if mrp_idx == -1 and len(headers) > 3: mrp_idx = 3

        if code_idx == -1 or qty_idx == -1:
            QMessageBox.critical(self, "Error", "Could not locate 'item_code' and 'quantity' columns.")
            return

        session = Session()
        success_count = 0
        skipped_count = 0
        total_purchase_amt = 0.0

        try:
            for r in rows[1:]:
                if not any(r): continue
                code = r[code_idx].strip() if code_idx < len(r) else ""
                if code.endswith(".0"): code = code[:-2]

                if not code:
                    skipped_count += 1
                    continue

                # Lookup item in Item Master
                item_master = session.query(Item).filter_by(item_code=code).first()
                if not item_master:
                    # Try inventory or fallback
                    inv_item = session.query(Inventory).filter_by(item_code=code).first()
                    name = inv_item.item_name if inv_item else f"Item-{code}"
                    mrp_fallback = inv_item.mrp if inv_item else 0.0
                    unit = inv_item.qty_type if inv_item and inv_item.qty_type else "piece"
                else:
                    name = item_master.name
                    mrp_fallback = item_master.mrp
                    unit = item_master.qty_type or "piece"

                try:
                    qty = float(r[qty_idx].strip()) if qty_idx < len(r) else 0.0
                except ValueError:
                    skipped_count += 1
                    continue

                if qty <= 0:
                    skipped_count += 1
                    continue

                cost = 0.0
                if cost_idx != -1 and cost_idx < len(r):
                    try: cost = float(r[cost_idx].replace(",", "").replace("₹", "").strip())
                    except ValueError: cost = 0.0

                mrp = mrp_fallback
                if mrp_idx != -1 and mrp_idx < len(r) and r[mrp_idx].strip():
                    try: mrp = float(r[mrp_idx].replace(",", "").replace("₹", "").strip())
                    except ValueError: pass

                track_stock = True
                if track_idx != -1 and track_idx < len(r):
                    val = r[track_idx].strip().lower()
                    if val in ["no", "false", "0", "n"]:
                        track_stock = False

                amt = qty * cost
                total_purchase_amt += amt

                purch = Purchase(total_amount=amt, date_time=datetime.now(), category="Bulk Import", track_item=track_stock)
                session.add(purch)
                session.flush()

                p_item = PurchaseItem(
                    purchase_id=purch.id,
                    item_code=code,
                    item_name=name,
                    quantity=qty,
                    cost_price=cost,
                    mrp=mrp,
                    amount=amt,
                    qty_type=unit,
                    track_item=track_stock
                )
                session.add(p_item)

                if track_stock:
                    inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).first()
                    if inv:
                        inv.quantity += qty
                        inv.cost_price = cost
                        if mrp > 0: inv.mrp = mrp
                        inv.item_code = code
                        inv.qty_type = unit
                    else:
                        inv = Inventory(
                            item_code=code,
                            item_name=name,
                            quantity=qty,
                            cost_price=cost,
                            mrp=mrp,
                            qty_type=unit
                        )
                        session.add(inv)

                success_count += 1

            session.commit()
            QMessageBox.information(
                self, "Bulk Purchase Success",
                f"Bulk Purchase Import Complete!\n\n"
                f"• Processed Items: {success_count}\n"
                f"• Total Purchase Value: ₹{total_purchase_amt:,.2f}\n"
                f"• Skipped Rows: {skipped_count}"
            )
            self.load_history()
            self.update_completers()
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", f"Failed saving bulk purchase: {e}")
        finally:
            session.close()
