import os
import csv
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
                             QPushButton, QTableWidget, QTableWidgetItem, QHeaderView, 
                             QMessageBox, QFileDialog, QFormLayout, QGroupBox, QComboBox,
                             QAbstractItemView)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QDoubleValidator

from database import Session, Item

class ItemTab(QWidget):
    def __init__(self):
        super().__init__()
        self.current_item_id = None
        self.init_ui()
        self.load_data()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        # --- TOP CONTROLS ---
        top_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by Item Code or Name...")
        self.search_input.textChanged.connect(self.load_data)

        self.refresh_btn = QPushButton("🔄 Refresh")
        self.refresh_btn.clicked.connect(self.load_data)

        self.sample_btn = QPushButton("📥 Download Sample Excel")
        self.sample_btn.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; padding: 6px 12px; border-radius: 6px;")
        self.sample_btn.clicked.connect(self.download_sample_excel)

        self.import_btn = QPushButton("📤 Import Items via Excel")
        self.import_btn.setStyleSheet("background-color: #10b981; color: white; font-weight: bold; padding: 6px 12px; border-radius: 6px;")
        self.import_btn.clicked.connect(self.import_excel)

        top_layout.addWidget(self.search_input)
        top_layout.addWidget(self.refresh_btn)
        top_layout.addWidget(self.sample_btn)
        top_layout.addWidget(self.import_btn)
        layout.addLayout(top_layout)

        # --- ITEMS TABLE ---
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Item Code", "Item Name", "MRP per Qty (₹)", "Qty Type (Unit)"])
        self.table.hideColumn(0)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.table.itemClicked.connect(self.load_item_to_form)
        layout.addWidget(self.table)

        # --- FORM GROUP ---
        form_group = QGroupBox("Add / Edit Item Details")
        form_layout = QHBoxLayout()

        self.code_input = QLineEdit()
        self.code_input.setPlaceholderText("e.g. 1 to 100")
        self.code_input.setFixedWidth(110)

        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Enter Item Name")

        self.mrp_input = QLineEdit()
        self.mrp_input.setPlaceholderText("MRP (0.00)")
        self.mrp_input.setFixedWidth(110)
        self.mrp_input.setValidator(QDoubleValidator(0.0, 999999.0, 2))

        self.unit_combo = QComboBox()
        self.unit_combo.setEditable(True)
        self.unit_combo.addItems(["piece", "kg", "pcs", "gram", "litre", "ml", "packet", "box", "bundle"])
        self.unit_combo.setFixedWidth(110)

        self.save_btn = QPushButton("Save Item")
        self.save_btn.setStyleSheet("background-color: #10b981; color: white; padding: 6px 14px; font-weight: bold; border-radius: 6px;")
        self.save_btn.clicked.connect(self.save_item)

        self.clear_btn = QPushButton("Clear")
        self.clear_btn.clicked.connect(self.clear_form)

        self.delete_btn = QPushButton("Delete")
        self.delete_btn.setStyleSheet("background-color: #ef4444; color: white; padding: 6px 14px; font-weight: bold; border-radius: 6px;")
        self.delete_btn.clicked.connect(self.delete_item)

        form_layout.addWidget(QLabel("Item Code:")); form_layout.addWidget(self.code_input)
        form_layout.addWidget(QLabel("Name:")); form_layout.addWidget(self.name_input)
        form_layout.addWidget(QLabel("MRP (₹):")); form_layout.addWidget(self.mrp_input)
        form_layout.addWidget(QLabel("Unit:")); form_layout.addWidget(self.unit_combo)
        form_layout.addWidget(self.save_btn)
        form_layout.addWidget(self.clear_btn)
        form_layout.addWidget(self.delete_btn)

        form_group.setLayout(form_layout)
        layout.addWidget(form_group)

    def load_data(self):
        search_txt = self.search_input.text().strip().lower()
        session = Session()
        query = session.query(Item)

        if search_txt:
            query = query.filter(
                (Item.item_code.contains(search_txt)) |
                (Item.name.ilike(f"%{search_txt}%"))
            )

        items = query.order_by(Item.name).all()

        self.table.blockSignals(True)
        self.table.setRowCount(0)
        for it in items:
            r = self.table.rowCount()
            self.table.insertRow(r)
            self.table.setItem(r, 0, QTableWidgetItem(str(it.id)))
            self.table.setItem(r, 1, QTableWidgetItem(str(it.item_code)))
            self.table.setItem(r, 2, QTableWidgetItem(it.name))
            self.table.setItem(r, 3, QTableWidgetItem(f"{it.mrp:.2f}"))
            self.table.setItem(r, 4, QTableWidgetItem(it.qty_type or "piece"))

        self.table.blockSignals(False)
        session.close()

    def load_item_to_form(self, item):
        row = item.row()
        self.current_item_id = self.table.item(row, 0).text()
        code = self.table.item(row, 1).text()
        name = self.table.item(row, 2).text()
        mrp = self.table.item(row, 3).text()
        unit = self.table.item(row, 4).text()

        self.code_input.setText(code)
        self.name_input.setText(name)
        self.mrp_input.setText(mrp)
        self.unit_combo.setEditText(unit)
        self.save_btn.setText("Update Item")

    def clear_form(self):
        self.current_item_id = None
        self.code_input.clear()
        self.name_input.clear()
        self.mrp_input.clear()
        self.unit_combo.setCurrentText("piece")
        self.save_btn.setText("Save Item")
        self.table.clearSelection()

    def save_item(self):
        code = self.code_input.text().strip()
        name = self.name_input.text().strip()
        mrp_str = self.mrp_input.text().strip()
        unit = self.unit_combo.currentText().strip() or "piece"

        if not code or not name:
            QMessageBox.warning(self, "Error", "Item Code and Item Name are required.")
            return

        try:
            mrp = float(mrp_str) if mrp_str else 0.0
        except ValueError:
            QMessageBox.warning(self, "Error", "Invalid MRP value.")
            return

        session = Session()
        try:
            if self.current_item_id:
                # Update existing
                it = session.query(Item).filter_by(id=self.current_item_id).first()
                if it:
                    # check code uniqueness
                    code_exists = session.query(Item).filter(Item.item_code == code, Item.id != self.current_item_id).first()
                    if code_exists:
                        QMessageBox.warning(self, "Error", f"Item Code '{code}' is already used by another item.")
                        session.close()
                        return
                    it.item_code = code
                    it.name = name
                    it.mrp = mrp
                    it.qty_type = unit
                    session.commit()
                    QMessageBox.information(self, "Success", f"Item '{name}' updated successfully.")
            else:
                # Check duplicate code
                existing = session.query(Item).filter_by(item_code=code).first()
                if existing:
                    QMessageBox.warning(self, "Duplicate Code", f"Item with code '{code}' already exists ({existing.name}).")
                    session.close()
                    return

                new_it = Item(item_code=code, name=name, mrp=mrp, qty_type=unit)
                session.add(new_it)
                session.commit()
                QMessageBox.information(self, "Success", f"Item '{name}' added successfully.")

            self.clear_form()
            self.load_data()
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

    def delete_item(self):
        if not self.current_item_id:
            row = self.table.currentRow()
            if row != -1:
                self.current_item_id = self.table.item(row, 0).text()
            else:
                QMessageBox.warning(self, "Warning", "Please select an item to delete.")
                return

        if QMessageBox.question(self, "Confirm Delete", "Are you sure you want to delete this item from the catalog?") == QMessageBox.StandardButton.Yes:
            session = Session()
            try:
                session.query(Item).filter_by(id=self.current_item_id).delete()
                session.commit()
                self.clear_form()
                self.load_data()
                QMessageBox.information(self, "Success", "Item deleted.")
            except Exception as e:
                session.rollback()
                QMessageBox.critical(self, "Error", f"Failed to delete: {e}")
            finally:
                session.close()

    def download_sample_excel(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save Sample Excel File", "Sample_Items_Catalog.xlsx", "Excel Files (*.xlsx);;CSV Files (*.csv)")
        if not path:
            return

        sample_data = [
            ["1", "Sugar M-30", 45.0, "kg"],
            ["2", "Basmati Rice 1kg", 95.0, "kg"],
            ["3", "Sunflower Oil 1L", 140.0, "litre"],
            ["4", "Amul Butter 100g", 58.0, "piece"],
            ["5", "Parle-G Biscuit 250g", 25.0, "packet"],
            ["6", "Milk Pouch 500ml", 32.0, "packet"],
            ["7", "Atta / Wheat Flour", 40.0, "kg"],
            ["8", "Bath Soap 125g", 35.0, "piece"]
        ]

        if path.lower().endswith(".csv"):
            try:
                with open(path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["item_code", "name", "mrp", "qty_type"])
                    for row in sample_data:
                        writer.writerow(row)
                QMessageBox.information(self, "Success", f"Sample CSV saved successfully to:\n{path}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to save CSV: {e}")
            return

        try:
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Items"

            header_fill = PatternFill(start_color="0078D4", end_color="0078D4", fill_type="solid")
            header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

            headers = ["item_code", "name", "mrp", "qty_type"]
            ws.append(headers)

            for col_num in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_num)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center")

            for row in sample_data:
                ws.append(row)

            # Auto-adjust column widths
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = openpyxl.utils.get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

            wb.save(path)
            QMessageBox.information(self, "Success", f"Sample Excel file created successfully at:\n{path}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to generate Excel file: {e}")

    def import_excel(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Excel / CSV to Import", "", "Spreadsheets (*.xlsx *.xls *.csv)")
        if not file_path:
            return

        rows_to_process = []
        is_csv = file_path.lower().endswith(".csv")

        try:
            if is_csv:
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    for r in reader:
                        if r: rows_to_process.append([c.strip() for c in r])
            else:
                wb = openpyxl.load_workbook(file_path, data_only=True)
                ws = wb.active
                for row in ws.iter_rows(values_only=True):
                    if any(row):
                        rows_to_process.append([str(c).strip() if c is not None else "" for c in row])

        except Exception as e:
            QMessageBox.critical(self, "Read Error", f"Could not read the file:\n{e}")
            return

        if len(rows_to_process) < 2:
            QMessageBox.warning(self, "Empty File", "File must contain at least a header row and one item row.")
            return

        # Determine column indexes from header
        headers = [h.lower().replace(" ", "").replace("_", "").replace(".", "") for h in rows_to_process[0]]
        
        code_idx = -1
        name_idx = -1
        mrp_idx = -1
        unit_idx = -1

        for idx, h in enumerate(headers):
            if "code" in h: code_idx = idx
            elif "name" in h or "title" in h or "item" in h: name_idx = idx
            elif "mrp" in h or "price" in h or "rate" in h: mrp_idx = idx
            elif "type" in h or "unit" in h or "qty" in h: unit_idx = idx

        # Fallback to column index by order if not found by name
        if code_idx == -1 and len(headers) > 0: code_idx = 0
        if name_idx == -1 and len(headers) > 1: name_idx = 1
        if mrp_idx == -1 and len(headers) > 2: mrp_idx = 2
        if unit_idx == -1 and len(headers) > 3: unit_idx = 3

        if code_idx == -1 or name_idx == -1:
            QMessageBox.critical(self, "Format Error", "Could not locate 'item_code' and 'name' columns in the file.")
            return

        session = Session()
        added_count = 0
        updated_count = 0
        skipped_count = 0

        try:
            for row in rows_to_process[1:]:
                if not any(row): continue

                code = row[code_idx].strip() if code_idx < len(row) else ""
                # Strip trailing .0 if Excel parsed integers as floats (e.g. '1.0' -> '1')
                if code.endswith(".0"):
                    code = code[:-2]

                name = row[name_idx].strip() if name_idx < len(row) else ""
                if not code or not name:
                    skipped_count += 1
                    continue

                mrp_val = 0.0
                if mrp_idx != -1 and mrp_idx < len(row):
                    try: mrp_val = float(row[mrp_idx].replace(",", "").replace("₹", "").strip())
                    except ValueError: mrp_val = 0.0

                unit_val = "piece"
                if unit_idx != -1 and unit_idx < len(row):
                    unit_val = row[unit_idx].strip().lower() or "piece"

                # Check if item_code exists
                existing_item = session.query(Item).filter_by(item_code=code).first()
                if existing_item:
                    existing_item.name = name
                    existing_item.mrp = mrp_val
                    existing_item.qty_type = unit_val
                    updated_count += 1
                else:
                    new_item = Item(item_code=code, name=name, mrp=mrp_val, qty_type=unit_val)
                    session.add(new_item)
                    added_count += 1

            session.commit()
            QMessageBox.information(
                self, "Import Finished",
                f"Excel Import Complete!\n\n"
                f"• Added: {added_count} new items\n"
                f"• Updated: {updated_count} existing items\n"
                f"• Skipped/Empty: {skipped_count} rows"
            )
            self.load_data()
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Database Error", f"Error saving imported items:\n{e}")
        finally:
            session.close()
