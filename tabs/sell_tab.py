import os
import sys
import subprocess
import tempfile
import configparser
import logging
import threading
import requests
import urllib.parse
from datetime import datetime

from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
                             QPushButton, QTableWidget, QTableWidgetItem, QHeaderView, 
                             QGroupBox, QFormLayout, QMessageBox, QCheckBox, QComboBox, 
                             QGridLayout, QCompleter, QDialog, QAbstractItemView, QFrame)
from PyQt6.QtCore import Qt, QStringListModel
from PyQt6.QtGui import QShortcut, QKeySequence, QDoubleValidator
from sqlalchemy import func

from database import (Session, Sale, SaleItem, Inventory, Customer, Item, 
                      PendingBill, PendingBillItem, get_current_business_details)
from modules.pdf_generator import generate_bill_pdf, generate_thermal_bill_pdf, print_receipt_direct
from modules.whatsapp_service import is_whatsapp_enabled, enable_whatsapp, disable_whatsapp

# --- CONFIGURATION ---
config = configparser.ConfigParser()
config.read('config.ini')
THERMAL_WIDTH_MM = config.getint('SETTINGS', 'thermal_width_mm', fallback=80)

# ==========================================
# DIALOG TO VIEW AND RESUME HELD BILLS
# ==========================================
class HoldBillsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Hold Bills")
        self.resize(700, 400)
        self.selected_pending_id = None
        self.init_ui()
        self.load_pending_bills()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        layout.addWidget(QLabel("<b>Held Bills:</b> Select a bill to resume checkout or delete."))

        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Held Time", "Customer", "Items Summary", "Total (₹)"])
        self.table.hideColumn(0)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

        btn_layout = QHBoxLayout()
        self.resume_btn = QPushButton("Resume Bill")
        self.resume_btn.setStyleSheet("background-color: #107c10; color: white; font-weight: bold; padding: 8px 16px;")
        self.resume_btn.clicked.connect(self.resume_bill)

        self.discard_btn = QPushButton("Delete Bill")
        self.discard_btn.setStyleSheet("background-color: #d32f2f; color: white; font-weight: bold; padding: 8px 16px;")
        self.discard_btn.clicked.connect(self.discard_bill)

        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.reject)

        btn_layout.addWidget(self.resume_btn)
        btn_layout.addWidget(self.discard_btn)
        btn_layout.addStretch()
        btn_layout.addWidget(close_btn)
        layout.addLayout(btn_layout)

    def load_pending_bills(self):
        session = Session()
        bills = session.query(PendingBill).order_by(PendingBill.date_time.desc()).all()

        self.table.setRowCount(0)
        for b in bills:
            r = self.table.rowCount()
            self.table.insertRow(r)
            self.table.setItem(r, 0, QTableWidgetItem(str(b.id)))
            self.table.setItem(r, 1, QTableWidgetItem(b.date_time.strftime("%d-%m-%Y %I:%M %p")))
            
            cust_str = b.customer_name or "Walk-in"
            if b.mobile_number: cust_str += f" ({b.mobile_number})"
            self.table.setItem(r, 2, QTableWidgetItem(cust_str))

            items_summary = ", ".join([f"{it.item_name} (x{it.quantity:g})" for it in b.items])
            self.table.setItem(r, 3, QTableWidgetItem(items_summary))
            self.table.setItem(r, 4, QTableWidgetItem(f"{b.net_total:.2f}"))

        session.close()

    def resume_bill(self):
        row = self.table.currentRow()
        if row == -1:
            QMessageBox.warning(self, "Selection", "Please select a held bill to resume.")
            return
        self.selected_pending_id = int(self.table.item(row, 0).text())
        self.accept()

    def discard_bill(self):
        row = self.table.currentRow()
        if row == -1:
            QMessageBox.warning(self, "Selection", "Please select a held bill to delete.")
            return

        pid = int(self.table.item(row, 0).text())
        if QMessageBox.question(self, "Confirm Delete", "Are you sure you want to delete this held bill?") == QMessageBox.StandardButton.Yes:
            session = Session()
            session.query(PendingBill).filter_by(id=pid).delete()
            session.commit()
            session.close()
            self.load_pending_bills()

# ==========================================
# MAIN POS / SELL TAB
# ==========================================
class SellTab(QWidget):
    def __init__(self):
        super().__init__()
        self.current_bill_id = None
        self._updating_discount = False
        self.init_ui()
        self.generate_new_bill_id()
        self.update_hold_badge()

    def init_ui(self):
        main_layout = QVBoxLayout()
        self.setLayout(main_layout)

        # --- 1. Top Bar: Bill Details, Customer & Hold Bills ---
        details_group = QGroupBox("Bill Details & Customer")
        details_layout = QVBoxLayout()

        row1 = QHBoxLayout()
        self.bill_id_label = QLabel()
        self.bill_id_label.setStyleSheet("font-weight: bold; color: #0078d4; font-size: 15px;")
        self.date_label = QLabel(datetime.now().strftime("%d-%m-%Y %I:%M %p"))

        self.status_banner = QLabel("")
        self.status_banner.setStyleSheet("color: #107c10; font-weight: bold; font-size: 13px; padding-left: 10px;")

        self.btn_hold_bill = QPushButton("Hold Bill")
        self.btn_hold_bill.setStyleSheet("background-color: #e65100; color: white; font-weight: bold; padding: 5px 12px;")
        self.btn_hold_bill.clicked.connect(self.hold_current_bill)

        self.btn_hold_bills = QPushButton("Hold Bills (0)")
        self.btn_hold_bills.setStyleSheet("background-color: #0288d1; color: white; font-weight: bold; padding: 5px 12px;")
        self.btn_hold_bills.clicked.connect(self.open_hold_bills_dialog)

        row1.addWidget(QLabel("<b>Bill ID:</b>"))
        row1.addWidget(self.bill_id_label)
        row1.addSpacing(15)
        row1.addWidget(QLabel("<b>Date:</b>"))
        row1.addWidget(self.date_label)
        row1.addWidget(self.status_banner)
        row1.addStretch()
        row1.addWidget(self.btn_hold_bill)
        row1.addWidget(self.btn_hold_bills)
        details_layout.addLayout(row1)

        # Customer Row
        row2 = QHBoxLayout()
        self.cust_name = QLineEdit("Walk-in Customer")
        self.cust_name.setPlaceholderText("Customer Name (e.g. Walk-in Customer)")

        self.completer = QCompleter()
        self.completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.completer.setFilterMode(Qt.MatchFlag.MatchContains)
        self.cust_name.setCompleter(self.completer)
        self.completer.activated.connect(self.load_customer_mobiles)
        self.cust_name.returnPressed.connect(self.load_customer_mobiles)

        self.mobile = QComboBox()
        self.mobile.setEditable(True)
        self.mobile.setPlaceholderText("Mobile Number (Optional)")
        self.mobile.setMinimumWidth(180)

        self.btn_wa_toggle = QPushButton()
        self.btn_wa_toggle.setFixedWidth(140)
        self.btn_wa_toggle.clicked.connect(self.toggle_whatsapp_quick)
        self.update_wa_toggle_button()

        row2.addWidget(QLabel("Name:")); row2.addWidget(self.cust_name)
        row2.addWidget(QLabel("Mobile:")); row2.addWidget(self.mobile)
        row2.addWidget(self.btn_wa_toggle)
        details_layout.addLayout(row2)

        details_group.setLayout(details_layout)
        main_layout.addWidget(details_group)

        # --- 2. Add Item Section (Code & Name Lookup) ---
        item_group = QGroupBox("Add Item to Cart")
        item_layout = QGridLayout()
        item_layout.setContentsMargins(10, 8, 10, 8)
        item_layout.setSpacing(8)

        item_layout.addWidget(QLabel("Item Code:"), 0, 0)
        item_layout.addWidget(QLabel("Product Name:"), 0, 1)
        self.qty_label = QLabel("Qty (Unit):")
        item_layout.addWidget(self.qty_label, 0, 2)
        item_layout.addWidget(QLabel("Rate / MRP:"), 0, 3)

        # Item Code Input
        self.item_code_input = QLineEdit()
        self.item_code_input.setPlaceholderText("Code (1-100)")
        self.item_code_input.setFixedWidth(100)
        self.code_completer = QCompleter()
        self.code_completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.code_completer.setFilterMode(Qt.MatchFlag.MatchContains)
        self.item_code_input.setCompleter(self.code_completer)
        self.code_completer.activated.connect(self.on_code_entered)
        self.item_code_input.returnPressed.connect(self.on_code_entered)

        # Product Name Combo
        self.item_combo = QComboBox()
        self.item_combo.setEditable(True)
        self.item_combo.setPlaceholderText("Select or Type Product Name")
        self.item_combo.setMinimumWidth(260)
        self.item_combo.currentIndexChanged.connect(self.on_item_select)

        # Quantity Input (Supports 0.5, 0.75, etc.)
        self.qty = QLineEdit("1.0")
        self.qty.setFixedWidth(90)
        self.qty.setValidator(QDoubleValidator(0.001, 999999.0, 3))
        self.qty.returnPressed.connect(self.focus_rate)

        # Rate Combo / LineEdit
        self.rate = QComboBox()
        self.rate.setEditable(True)
        self.rate.setFixedWidth(110)
        self.rate.lineEdit().returnPressed.connect(self.add_item)

        # Unit tracking variable for current item
        self.current_unit = "piece"

        add_btn = QPushButton("➕ Add Item")
        add_btn.setStyleSheet("height: 28px; font-weight: bold; background-color: #0078d4; color: white; padding: 0 12px;")
        add_btn.clicked.connect(self.add_item)

        del_btn = QPushButton("🗑️ Delete Item")
        del_btn.setStyleSheet("height: 28px; background-color: #d32f2f; color: white; font-weight: bold; padding: 0 12px;")
        del_btn.clicked.connect(self.delete_item)

        item_layout.addWidget(self.item_code_input, 1, 0)
        item_layout.addWidget(self.item_combo, 1, 1)
        item_layout.addWidget(self.qty, 1, 2)
        item_layout.addWidget(self.rate, 1, 3)
        item_layout.addWidget(add_btn, 1, 4)
        item_layout.addWidget(del_btn, 1, 5)

        item_layout.setColumnStretch(1, 1)

        QWidget.setTabOrder(self.item_code_input, self.item_combo)
        QWidget.setTabOrder(self.item_combo, self.qty)
        QWidget.setTabOrder(self.qty, self.rate)
        QWidget.setTabOrder(self.rate, add_btn)

        item_group.setLayout(item_layout)
        main_layout.addWidget(item_group)

        # --- 3. Items Table ---
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels(["Sr.", "Code", "Item Description", "Qty", "Unit", "Rate", "Amount"])
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.doubleClicked.connect(self.edit_item)
        main_layout.addWidget(self.table)

        # --- 4. Bottom Section: Totals, Discounts, Thermal Print & Save ---
        bottom_layout = QHBoxLayout()
        self.paid_chk = QCheckBox("Mark as Paid")
        self.paid_chk.setChecked(True)
        self.clear_btn = QPushButton("Clear Form")
        self.clear_btn.setStyleSheet("background-color: #ef4444; color: white; font-weight: 600; padding: 6px 14px; border-radius: 6px;")
        self.clear_btn.clicked.connect(self.reset_form)

        # Discount Controls (Percentage and Amount)
        self.discount_pct_label = QLabel("Disc (%):")
        self.discount_pct_input = QLineEdit("0.00")
        self.discount_pct_input.setFixedWidth(55)
        self.discount_pct_input.setValidator(QDoubleValidator(0.0, 100.0, 2))
        self.discount_pct_input.textChanged.connect(self.on_discount_pct_changed)

        self.discount_amt_label = QLabel("Disc (₹):")
        self.discount_amt_input = QLineEdit("0.00")
        self.discount_amt_input.setFixedWidth(70)
        self.discount_amt_input.setValidator(QDoubleValidator(0.0, 999999.0, 2))
        self.discount_amt_input.textChanged.connect(self.on_discount_amt_changed)

        # Subtotal & Total
        self.subtotal_label = QLabel("Subtotal: ₹0.00")
        self.subtotal_label.setMinimumWidth(150)
        self.subtotal_label.setStyleSheet("font-size: 14px; font-weight: bold;")

        self.total_label = QLabel("Total: ₹0.00")
        self.total_label.setMinimumWidth(180)
        self.total_label.setStyleSheet("font-size: 22px; font-weight: bold; color: #ef4444;")

        self.save_btn = QPushButton("Save Bill")
        self.save_btn.setStyleSheet("background-color: #10b981; color: white; padding: 10px 24px; font-weight: bold; font-size: 14px; border-radius: 6px;")
        self.save_btn.clicked.connect(self.save_bill)

        save_shortcut = QShortcut(QKeySequence("Ctrl+S"), self)
        save_shortcut.activated.connect(self.save_bill)

        f5_shortcut = QShortcut(QKeySequence("F5"), self)
        f5_shortcut.activated.connect(self.reset_form)

        bottom_layout.addWidget(self.paid_chk)
        bottom_layout.addWidget(self.clear_btn)
        bottom_layout.addStretch()

        bottom_layout.addWidget(self.subtotal_label)
        bottom_layout.addWidget(self.discount_pct_label)
        bottom_layout.addWidget(self.discount_pct_input)
        bottom_layout.addWidget(self.discount_amt_label)
        bottom_layout.addWidget(self.discount_amt_input)
        bottom_layout.addWidget(self.total_label)
        bottom_layout.addWidget(self.save_btn)

        main_layout.addLayout(bottom_layout)
        self.refresh_data()

    def showEvent(self, event):
        super().showEvent(event)
        self.refresh_data()
        self.update_hold_badge()
        self.update_wa_toggle_button()

    def refresh_data(self):
        session = Session()

        # Load codes and items from Item Master
        items = session.query(Item).order_by(Item.name).all()
        codes = [str(i.item_code) for i in items if i.item_code]
        names = [i.name for i in items if i.name]

        # Also add any unique inventory names
        inv_items = session.query(Inventory.item_name).distinct().all()
        for iv in inv_items:
            if iv[0] and iv[0] not in names:
                names.append(iv[0])

        self.code_completer.setModel(QStringListModel(codes))

        self.item_combo.blockSignals(True)
        self.item_combo.clear()
        for n in names:
            self.item_combo.addItem(n)
        self.item_combo.setCurrentIndex(-1)
        self.item_combo.blockSignals(False)

        customers = session.query(Customer.name).distinct().all()
        cust_names = [c.name for c in customers if c.name]
        self.completer.setModel(QStringListModel(cust_names))

        session.close()

    def on_code_entered(self):
        code = self.item_code_input.text().strip()
        if not code: return

        session = Session()
        item = session.query(Item).filter_by(item_code=code).first()
        if item:
            self.item_combo.setEditText(item.name)
            self.rate.clear()
            self.rate.addItem(f"{item.mrp:.2f}")
            self.rate.setEditText(f"{item.mrp:.2f}")
            self.current_unit = item.qty_type or "piece"
            self.qty_label.setText(f"Qty ({self.current_unit}):")

            # Check if stock exists in inventory to inform user (without blocking)
            inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == item.name.lower()).first()
            if inv:
                self.rate.setToolTip(f"In Inventory: {inv.quantity:g} {inv.qty_type or 'piece'}")
            else:
                self.rate.setToolTip("Item not in inventory stock (allowed to sell)")

            self.qty.setFocus()
            self.qty.selectAll()
        else:
            QMessageBox.warning(self, "Catalog Warning", f"Item Code '{code}' not found in Item Catalog.\nPlease add it in the Items tab.")
            self.item_code_input.setFocus()
        session.close()

    def on_item_select(self):
        name = self.item_combo.currentText().strip()
        if not name: return

        session = Session()
        item = session.query(Item).filter(func.lower(Item.name) == name.lower()).first()
        if item:
            self.item_code_input.setText(str(item.item_code))
            self.current_unit = item.qty_type or "piece"
            self.qty_label.setText(f"Qty ({self.current_unit}):")

            self.rate.blockSignals(True)
            self.rate.clear()
            self.rate.addItem(f"{item.mrp:.2f}")

            # Also check if inventory has any different price points
            inv_items = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).all()
            for inv in inv_items:
                if inv.mrp and f"{inv.mrp:.2f}" != f"{item.mrp:.2f}":
                    self.rate.addItem(f"{inv.mrp:.2f}")

            self.rate.setEditText(f"{item.mrp:.2f}")
            self.rate.blockSignals(False)

            self.qty.setFocus()
            self.qty.selectAll()
        else:
            inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).first()
            if inv:
                if inv.item_code: self.item_code_input.setText(str(inv.item_code))
                self.current_unit = inv.qty_type or "piece"
                self.qty_label.setText(f"Qty ({self.current_unit}):")
                self.rate.setEditText(f"{inv.mrp:.2f}")
                self.qty.setFocus()
                self.qty.selectAll()

        session.close()

    def focus_rate(self):
        self.rate.setFocus()

    def load_customer_mobiles(self):
        name = self.cust_name.text().strip()
        if not name: return
        session = Session()
        customers = session.query(Customer).filter_by(name=name).all()
        session.close()

        self.mobile.blockSignals(True)
        self.mobile.clear()
        found = False
        for c in customers:
            if c.mobile:
                self.mobile.addItem(c.mobile)
                found = True
        self.mobile.blockSignals(False)

        if found:
            self.mobile.showPopup(); self.mobile.setFocus()
        else:
            self.mobile.setEditText(""); self.mobile.setFocus()

    def generate_new_bill_id(self):
        session = Session()
        today = datetime.now().strftime('%Y%m%d')
        bills_today = session.query(Sale).filter(Sale.bill_id.like(f"INV-{today}-%")).all()
        numbers = [int(b.bill_id.split('-')[-1]) for b in bills_today if b.bill_id.split('-')[-1].isdigit()]
        next_num = max(numbers) + 1 if numbers else 1
        bill_id = f"INV-{today}-{next_num:04d}"
        self.bill_id_label.setText(bill_id)
        session.close()
        return bill_id

    def add_item(self):
        try:
            name = self.item_combo.currentText().strip().title()
            code = self.item_code_input.text().strip()

            if not name:
                return QMessageBox.warning(self, "Error", "Please select or enter a product name.")

            # Validate against Item Catalog
            session = Session()
            catalog_item = None
            if code:
                catalog_item = session.query(Item).filter_by(item_code=code).first()
            if not catalog_item:
                catalog_item = session.query(Item).filter(func.lower(Item.name) == name.lower()).first()

            if not catalog_item:
                session.close()
                return QMessageBox.warning(
                    self, "Catalog Item Required",
                    f"'{name}' must be present in the Item Catalog.\n\nPlease add it in the '🏷️ Items' tab first with code and MRP."
                )

            # Resolve official code and unit
            official_code = str(catalog_item.item_code)
            unit = catalog_item.qty_type or "piece"
            session.close()

            qty_val = float(self.qty.text().strip())
            rate_txt = self.rate.currentText().strip() or "0.0"
            rate_val = float(rate_txt)

            if qty_val <= 0:
                return QMessageBox.warning(self, "Error", "Quantity must be greater than zero.")

            amt = qty_val * rate_val

            self.table.blockSignals(True)
            row_to_update = -1
            for r in range(self.table.rowCount()):
                existing_code = self.table.item(r, 1).text()
                existing_name = self.table.item(r, 2).text()
                existing_rate = float(self.table.item(r, 5).text())

                if (existing_code == official_code or existing_name.lower() == name.lower()) and existing_rate == rate_val:
                    row_to_update = r
                    break

            if row_to_update != -1:
                current_qty = float(self.table.item(row_to_update, 3).text())
                new_qty = current_qty + qty_val
                new_amt = new_qty * rate_val
                self.table.setItem(row_to_update, 3, QTableWidgetItem(f"{new_qty:g}"))
                self.table.setItem(row_to_update, 6, QTableWidgetItem(f"{new_amt:.2f}"))
            else:
                row = self.table.rowCount()
                self.table.insertRow(row)
                self.table.setItem(row, 0, QTableWidgetItem(str(row + 1)))
                self.table.setItem(row, 1, QTableWidgetItem(official_code))
                self.table.setItem(row, 2, QTableWidgetItem(name))
                self.table.setItem(row, 3, QTableWidgetItem(f"{qty_val:g}"))
                self.table.setItem(row, 4, QTableWidgetItem(unit))
                self.table.setItem(row, 5, QTableWidgetItem(f"{rate_val:.2f}"))
                self.table.setItem(row, 6, QTableWidgetItem(f"{amt:.2f}"))

            self.table.blockSignals(False)
            self.calculate_total()

            self.item_code_input.clear()
            self.item_combo.setCurrentIndex(-1)
            self.item_combo.setEditText("")
            self.rate.clear()
            self.qty.setText("1.0")
            self.qty_label.setText("Qty:")
            self.item_code_input.setFocus()

        except ValueError:
            QMessageBox.warning(self, "Input Error", "Invalid Quantity or Rate.")

    def edit_item(self, index):
        row = index.row()
        code = self.table.item(row, 1).text()
        name = self.table.item(row, 2).text()
        qty = self.table.item(row, 3).text()
        unit = self.table.item(row, 4).text()
        rate = self.table.item(row, 5).text()

        self.table.removeRow(row)
        self.table.blockSignals(True)
        for i in range(self.table.rowCount()):
            self.table.item(i, 0).setText(str(i + 1))
        self.table.blockSignals(False)
        self.calculate_total()

        self.item_code_input.setText(code)
        self.item_combo.setEditText(name)
        self.qty.setText(qty)
        self.rate.setEditText(rate)
        self.qty_label.setText(f"Qty ({unit}):")
        self.qty.setFocus()
        self.qty.selectAll()

    def delete_item(self):
        row = self.table.currentRow()
        if row > -1:
            self.table.removeRow(row)
            self.table.blockSignals(True)
            for i in range(self.table.rowCount()):
                self.table.item(i, 0).setText(str(i + 1))
            self.table.blockSignals(False)
            self.calculate_total()
        else:
            QMessageBox.information(self, "Info", "Select a row to delete.")

    def on_discount_pct_changed(self, text):
        if self._updating_discount: return
        self._updating_discount = True
        try:
            pct = float(text.strip()) if text.strip() else 0.0
            subtotal = self.get_subtotal()
            amt = (subtotal * (pct / 100.0))
            self.discount_amt_input.setText(f"{amt:.2f}")
        except ValueError:
            pass
        self._updating_discount = False
        self.calculate_total()

    def on_discount_amt_changed(self, text):
        if self._updating_discount: return
        self._updating_discount = True
        try:
            amt = float(text.strip()) if text.strip() else 0.0
            subtotal = self.get_subtotal()
            pct = (amt / subtotal * 100.0) if subtotal > 0 else 0.0
            self.discount_pct_input.setText(f"{pct:.2f}")
        except ValueError:
            pass
        self._updating_discount = False
        self.calculate_total()

    def get_subtotal(self):
        subtotal = 0.0
        for r in range(self.table.rowCount()):
            try: subtotal += float(self.table.item(r, 6).text())
            except Exception: pass
        return subtotal

    def calculate_total(self):
        subtotal = self.get_subtotal()
        self.subtotal_label.setText(f"Subtotal: ₹{subtotal:,.2f}")

        disc_amt = 0.0
        disc_pct = 0.0
        try:
            disc_amt = float(self.discount_amt_input.text().strip()) if self.discount_amt_input.text().strip() else 0.0
            disc_pct = float(self.discount_pct_input.text().strip()) if self.discount_pct_input.text().strip() else 0.0
        except ValueError:
            pass

        net = max(0.0, subtotal - disc_amt)
        self.total_label.setText(f"Total: ₹{net:,.2f}")
        return subtotal, disc_pct, disc_amt, net

    def save_bill(self):
        mobile = self.mobile.currentText().strip()
        name = self.cust_name.text().strip()

        if self.table.rowCount() == 0:
            return QMessageBox.warning(self, "Error", "Cannot save an empty bill. Add items first.")

        session = Session()
        try:
            bill_id = self.bill_id_label.text() if self.current_bill_id else self.generate_new_bill_id()

            # Record customer in CRM only if mobile is provided or a custom named customer
            if mobile or (name and name.lower() != "walk-in customer"):
                cust = session.query(Customer).filter_by(mobile=mobile).first() if mobile else None
                if cust:
                    if name: cust.name = name
                    cust.last_visit = datetime.now()
                elif mobile:
                    session.add(Customer(mobile=mobile, name=name, last_visit=datetime.now()))

            # If editing existing bill, revert previously deducted items
            if self.current_bill_id:
                old_items = session.query(SaleItem).filter_by(sale_bill_id=bill_id).all()
                for item in old_items:
                    inv = session.query(Inventory).filter(
                        func.lower(Inventory.item_name) == item.item_name.lower()
                    ).first()
                    if inv:
                        inv.quantity += item.quantity

                session.query(SaleItem).filter_by(sale_bill_id=bill_id).delete()
                session.query(Sale).filter_by(bill_id=bill_id).delete()

            sub, disc_pct, disc_amt, net = self.calculate_total()
            sale = Sale(
                bill_id=bill_id,
                customer_name=name,
                mobile_number=mobile,
                subtotal=sub,
                discount_percent=disc_pct,
                discount_amount=disc_amt,
                net_total=net,
                paid_status=self.paid_chk.isChecked()
            )
            session.add(sale)

            receipt_items = []
            for r in range(self.table.rowCount()):
                icode = self.table.item(r, 1).text()
                iname = self.table.item(r, 2).text()
                iqty = float(self.table.item(r, 3).text())
                iunit = self.table.item(r, 4).text()
                irate = float(self.table.item(r, 5).text())
                iamt = float(self.table.item(r, 6).text())

                session.add(SaleItem(
                    sale_bill_id=bill_id,
                    sr_no=r + 1,
                    item_code=icode,
                    item_name=iname,
                    quantity=iqty,
                    rate=irate,
                    amount=iamt,
                    qty_type=iunit
                ))

                # Deduct inventory if tracked in stock
                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == iname.lower()).first()
                if inv:
                    inv.quantity -= iqty
                    if inv.quantity <= 0:
                        session.delete(inv)

                receipt_items.append({
                    'sr_no': r + 1,
                    'item_code': icode,
                    'item_name': iname,
                    'quantity': iqty,
                    'qty_type': iunit,
                    'rate': irate,
                    'amount': iamt
                })

            session.commit()

            # --- DIRECT THERMAL PRINTING (ZERO TEMP FILES) ---
            cfg = configparser.ConfigParser()
            cfg.read('config.ini')
            t_width = cfg.getint('SETTINGS', 'thermal_width_mm', fallback=80)
            p_name = cfg.get('SETTINGS', 'printer_name', fallback='Default Windows Printer')
            if p_name == 'Default Windows Printer':
                p_name = None

            biz = get_current_business_details()

            bill_data = {
                'bill_id': bill_id,
                'date_time': datetime.now(),
                'customer_name': name,
                'mobile_number': mobile,
                'items': receipt_items,
                'subtotal': sub,
                'discount_percent': disc_pct,
                'discount_amount': disc_amt,
                'net_total': net
            }

            print_receipt_direct(bill_data, biz, paper_width_mm=t_width, printer_name=p_name)

            # --- WHATSAPP LOGIC (AUTOMATIC BACKEND WITH THERMAL RECEIPT PDF) ---
            if is_whatsapp_enabled():
                if mobile and mobile.strip():
                    pdf_path = os.path.join(tempfile.gettempdir(), f"Receipt_{bill_id}.pdf")
                    try:
                        generate_thermal_bill_pdf(bill_data, biz, pdf_path, paper_width_mm=t_width)
                    except Exception as err:
                        logging.warning(f"Thermal receipt PDF generation error for WhatsApp: {err}")
                        pdf_path = None
                    self.send_whatsapp_waha(
                        mobile.strip(), 
                        bill_id, 
                        net, 
                        name, 
                        receipt_items, 
                        subtotal=sub, 
                        discount_amount=disc_amt, 
                        discount_percent=disc_pct, 
                        pdf_path=pdf_path
                    )
                else:
                    print(f"[WHATSAPP LOG] WhatsApp skipped (no mobile number provided for Bill #{bill_id}).")
            else:
                print(f"[WHATSAPP LOG] WhatsApp skipped (messaging is STOPPED/DISABLED for Bill #{bill_id}).")

            # Sleek inline feedback - shows bill ID, printer target, and total
            if p_name and "no printer" in p_name.lower():
                target_p = "No Printer"
            else:
                target_p = p_name or "Default Printer"

            if is_whatsapp_enabled() and mobile and mobile.strip():
                wa_note = " & WhatsApp Receipt sent"
            elif not is_whatsapp_enabled():
                wa_note = " (WhatsApp: Stopped)"
            else:
                wa_note = ""
            self.status_banner.setText(f"✓ Bill {bill_id} saved & sent to {target_p}{wa_note}! (Total: ₹{net:,.2f})")
            self.reset_form()
            self.refresh_data()
            self.item_code_input.setFocus()

        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

    def send_whatsapp_waha(self, number, bill_id, amount, customer_name, items, 
                           subtotal=0.0, discount_amount=0.0, discount_percent=0.0, pdf_path=None):
        """
        Automatic silent backend WhatsApp dispatch via local WAHA REST API.
        Attaches exact thermal receipt PDF and sends in background thread (no POS UI lag).
        """
        def _send():
            try:
                clean_mob = number.replace(" ", "").replace("-", "").replace("+", "").strip()
                if len(clean_mob) == 10 and clean_mob.isdigit():
                    clean_mob = "91" + clean_mob
                elif not clean_mob.isdigit():
                    return

                chat_id = f"{clean_mob}@c.us"

                items_summary = "\n".join([
                    f"• {it['item_name']} (x{it['quantity']:g} {it.get('qty_type','')}) = Rs. {it['amount']:.2f}" 
                    for it in items[:8]
                ])
                if len(items) > 8:
                    items_summary += f"\n...and {len(items)-8} more items"

                biz = get_current_business_details()
                biz_name = getattr(biz, 'name', 'Our Store') or 'Our Store'

                # Totals & Discount breakdown in text message
                if discount_amount > 0:
                    disc_label = f"🎁 *Discount ({discount_percent:g}%):*" if discount_percent > 0 else "🎁 *Discount:*"
                    totals_summary = (
                        f"📊 *Subtotal:* Rs. {subtotal:,.2f}\n"
                        f"{disc_label} - Rs. {discount_amount:,.2f}\n"
                        f"💰 *Grand Total:* Rs. {amount:,.2f}"
                    )
                else:
                    totals_summary = f"💰 *Grand Total:* Rs. {amount:,.2f}"

                msg = (
                    f"Dear {customer_name or 'Customer'},\n"
                    f"Thank you for shopping at *{biz_name}*!\n\n"
                    f"🧾 *Invoice #:* {bill_id}\n"
                    f"📅 *Date:* {datetime.now().strftime('%d-%m-%Y %I:%M %p')}\n\n"
                    f"*Items Purchased:*\n{items_summary}\n\n"
                    f"{totals_summary}\n\n"
                    f"🧾 *Thermal Receipt PDF is attached below.*\n"
                    f"Visit again soon!"
                )

                cfg = configparser.ConfigParser()
                cfg.read('config.ini')
                waha_endpoint = cfg.get('SETTINGS', 'waha_url', fallback='http://localhost:3000')

                sent_file = False
                if pdf_path and os.path.exists(pdf_path):
                    try:
                        import base64
                        with open(pdf_path, 'rb') as f:
                            b64_pdf = base64.b64encode(f.read()).decode('utf-8')

                        file_payload = {
                            "session": "default",
                            "chatId": chat_id,
                            "file": {
                                "mimetype": "application/pdf",
                                "filename": f"Receipt_{bill_id}.pdf",
                                "data": b64_pdf
                            },
                            "caption": msg
                        }
                        res = requests.post(f"{waha_endpoint}/api/sendFile", json=file_payload, timeout=8)
                        if res.status_code in [200, 201]:
                            sent_file = True
                    except Exception as err:
                        logging.warning(f"WAHA sendFile failed: {err}")

                # If sendFile not supported or failed, fallback to sendText
                if not sent_file:
                    text_payload = {
                        "session": "default",
                        "chatId": chat_id,
                        "text": msg
                    }
                    requests.post(f"{waha_endpoint}/api/sendText", json=text_payload, timeout=4)
                    print(f"[WHATSAPP LOG] ✓ Invoice text message sent to {clean_mob} (Invoice #{bill_id})")
                else:
                    print(f"[WHATSAPP LOG] ✓ Thermal receipt PDF & invoice message sent to {clean_mob} (Invoice #{bill_id})")

                # Clean up temporary PDF file after dispatch
                if pdf_path and os.path.exists(pdf_path):
                    try:
                        os.remove(pdf_path)
                    except Exception:
                        pass

            except Exception as e:
                logging.warning(f"WAHA WhatsApp dispatch warning: {e}")
                print(f"[WHATSAPP LOG] ⚠️ WhatsApp dispatch notice: {e}")

        threading.Thread(target=_send, daemon=True).start()

    def hold_current_bill(self):
        """Holds the current cart so cashier can serve another customer"""
        if self.table.rowCount() == 0:
            QMessageBox.warning(self, "Empty Cart", "No items in cart to hold.")
            return

        cust = self.cust_name.text().strip() or "Customer"
        mob = self.mobile.currentText().strip()
        sub, disc_pct, disc_amt, net = self.calculate_total()

        session = Session()
        try:
            p_bill = PendingBill(
                customer_name=cust,
                mobile_number=mob,
                subtotal=sub,
                discount_percent=disc_pct,
                discount_amount=disc_amt,
                net_total=net,
                note=f"Held with {self.table.rowCount()} items"
            )
            session.add(p_bill)
            session.flush()

            for r in range(self.table.rowCount()):
                icode = self.table.item(r, 1).text()
                iname = self.table.item(r, 2).text()
                iqty = float(self.table.item(r, 3).text())
                iunit = self.table.item(r, 4).text()
                irate = float(self.table.item(r, 5).text())
                iamt = float(self.table.item(r, 6).text())

                session.add(PendingBillItem(
                    pending_bill_id=p_bill.id,
                    sr_no=r + 1,
                    item_code=icode,
                    item_name=iname,
                    quantity=iqty,
                    rate=irate,
                    amount=iamt,
                    qty_type=iunit
                ))

            session.commit()
            # Fast inline notification - no disruptive "OK" modal box
            self.status_banner.setText(f"✓ Bill held for '{cust}'. Ready for next customer.")
            self.reset_form()
            self.update_hold_badge()
            self.item_code_input.setFocus()
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", f"Failed to hold bill: {e}")
        finally:
            session.close()

    def park_current_bill(self):
        self.hold_current_bill()

    def open_hold_bills_dialog(self):
        dialog = HoldBillsDialog(self)
        if dialog.exec() == QDialog.DialogCode.Accepted and dialog.selected_pending_id:
            self.resume_held_bill(dialog.selected_pending_id)

    def open_pending_bills_dialog(self):
        self.open_hold_bills_dialog()

    def resume_held_bill(self, pending_id):
        if self.table.rowCount() > 0:
            reply = QMessageBox.question(
                self, "Active Cart",
                "You currently have items in the cart.\nDo you want to hold current items before resuming?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No | QMessageBox.StandardButton.Cancel
            )
            if reply == QMessageBox.StandardButton.Yes:
                self.hold_current_bill()
            elif reply == QMessageBox.StandardButton.Cancel:
                return

        session = Session()
        pb = session.query(PendingBill).filter_by(id=pending_id).first()
        if not pb:
            session.close()
            return

        self.reset_form()
        self.cust_name.setText(pb.customer_name or "")
        self.mobile.setEditText(pb.mobile_number or "")
        self.discount_pct_input.setText(f"{pb.discount_percent:.2f}")
        self.discount_amt_input.setText(f"{pb.discount_amount:.2f}")

        self.table.blockSignals(True)
        self.table.setRowCount(0)
        for it in pb.items:
            r = self.table.rowCount()
            self.table.insertRow(r)
            self.table.setItem(r, 0, QTableWidgetItem(str(r + 1)))
            self.table.setItem(r, 1, QTableWidgetItem(it.item_code or ""))
            self.table.setItem(r, 2, QTableWidgetItem(it.item_name))
            self.table.setItem(r, 3, QTableWidgetItem(f"{it.quantity:g}"))
            self.table.setItem(r, 4, QTableWidgetItem(it.qty_type or "piece"))
            self.table.setItem(r, 5, QTableWidgetItem(f"{it.rate:.2f}"))
            self.table.setItem(r, 6, QTableWidgetItem(f"{it.amount:.2f}"))

        self.table.blockSignals(False)
        self.calculate_total()

        # Delete the resumed pending bill from storage
        session.delete(pb)
        session.commit()
        session.close()

        self.update_hold_badge()
        # Fast inline notification - no disruptive "OK" modal box
        self.status_banner.setText(f"✓ Resumed held bill for '{pb.customer_name or 'Customer'}'.")
        self.item_code_input.setFocus()

    def resume_pending_bill(self, pending_id):
        self.resume_held_bill(pending_id)

    def update_hold_badge(self):
        session = Session()
        try:
            count = session.query(PendingBill).count()
            self.btn_hold_bills.setText(f"Hold Bills ({count})")
            if count > 0:
                self.btn_hold_bills.setStyleSheet("background-color: #d84315; color: white; font-weight: bold; padding: 5px 12px;")
            else:
                self.btn_hold_bills.setStyleSheet("background-color: #0288d1; color: white; font-weight: bold; padding: 5px 12px;")
        except Exception:
            pass
        finally:
            session.close()

    def update_pending_badge(self):
        self.update_hold_badge()

    def update_wa_toggle_button(self):
        enabled = is_whatsapp_enabled()
        if enabled:
            self.btn_wa_toggle.setText("📱 WhatsApp: ON")
            self.btn_wa_toggle.setStyleSheet(
                "background-color: #107c10; color: white; font-weight: bold; padding: 4px 10px; border-radius: 4px;"
            )
            self.btn_wa_toggle.setToolTip("WhatsApp sending is ACTIVE. Click to STOP sending.")
        else:
            self.btn_wa_toggle.setText("📱 WhatsApp: OFF")
            self.btn_wa_toggle.setStyleSheet(
                "background-color: #767676; color: white; font-weight: bold; padding: 4px 10px; border-radius: 4px;"
            )
            self.btn_wa_toggle.setToolTip("WhatsApp sending is STOPPED. Click to START sending.")

    def toggle_whatsapp_quick(self):
        if is_whatsapp_enabled():
            disable_whatsapp()
        else:
            enable_whatsapp()
        self.update_wa_toggle_button()

    def reset_form(self):
        self.current_bill_id = None
        self.generate_new_bill_id()
        self.save_btn.setText("Save Bill")
        self.table.setRowCount(0)
        self.cust_name.setText("Walk-in Customer")
        self.cust_name.selectAll()
        self.mobile.clear()
        self.mobile.setEditText("")
        self.item_code_input.clear()
        self.item_combo.setCurrentIndex(-1)
        self.item_combo.setEditText("")
        self.qty.setText("1.0")
        self.qty_label.setText("Qty:")
        self.rate.clear()
        self.rate.setEditText("0.00")
        self._updating_discount = True
        self.discount_pct_input.setText("0.00")
        self.discount_amt_input.setText("0.00")
        self._updating_discount = False
        self.paid_chk.setChecked(True)
        self.calculate_total()
        self.item_code_input.setFocus()

    def load_bill_for_edit(self, bill_id):
        session = Session()
        sale = session.query(Sale).filter_by(bill_id=bill_id).first()
        if not sale:
            session.close()
            return

        self.current_bill_id = bill_id
        self.bill_id_label.setText(bill_id)
        self.cust_name.setText(sale.customer_name or "Walk-in Customer")
        self.mobile.setEditText(sale.mobile_number or "")
        self.paid_chk.setChecked(sale.paid_status)

        self._updating_discount = True
        self.discount_pct_input.setText(f"{sale.discount_percent:.2f}")
        self.discount_amt_input.setText(f"{getattr(sale, 'discount_amount', 0.0) or 0.0:.2f}")
        self._updating_discount = False

        self.save_btn.setText("Update Bill")
        self.table.setRowCount(0)
        self.table.blockSignals(True)

        for item in sale.items:
            r = self.table.rowCount()
            self.table.insertRow(r)
            self.table.setItem(r, 0, QTableWidgetItem(str(item.sr_no)))
            self.table.setItem(r, 1, QTableWidgetItem(str(item.item_code or "")))
            self.table.setItem(r, 2, QTableWidgetItem(item.item_name))
            self.table.setItem(r, 3, QTableWidgetItem(f"{item.quantity:g}"))
            self.table.setItem(r, 4, QTableWidgetItem(item.qty_type or "piece"))
            self.table.setItem(r, 5, QTableWidgetItem(f"{item.rate:.2f}"))
            self.table.setItem(r, 6, QTableWidgetItem(f"{item.amount:.2f}"))

        self.table.blockSignals(False)
        self.calculate_total()
        session.close()
        session.close()
