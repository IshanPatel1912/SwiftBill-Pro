import sys
import os
from datetime import datetime
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QTableWidget, QTableWidgetItem, 
                             QPushButton, QHeaderView, QMessageBox, QDialog, QLabel, 
                             QLineEdit, QHBoxLayout, QAbstractItemView, QFileDialog)
from PyQt6.QtCore import Qt
from database import Session, Inventory, Item, get_current_business_details
from sqlalchemy import func

# --- PDF Generation Imports ---
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

try:
    font_path = resource_path("arial.ttf")
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('Arial', font_path))
except Exception as e:
    print(f"Arial font notice: {e}")

# ==========================================
# DIALOG FOR ADDING OPENING STOCK
# ==========================================
class AddOpeningStockDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add Opening Stock (Bulk Entry)")
        self.resize(750, 420) 
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout()
        layout.addWidget(QLabel("Add multiple inventory items below. Double-click to edit rows."))
        
        self.table = QTableWidget()
        self.table.setColumnCount(5) 
        self.table.setHorizontalHeaderLabels(["Item Code", "Item Name", "Quantity", "Cost Price", "MRP"])
        
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.table.setColumnWidth(0, 90)
        self.table.setColumnWidth(2, 90)
        self.table.setColumnWidth(3, 90)
        self.table.setColumnWidth(4, 90)
        
        self.add_rows(5)
        layout.addWidget(self.table)
        
        btn_layout = QHBoxLayout()
        add_row_btn = QPushButton("➕ Add Row")
        add_row_btn.clicked.connect(lambda: self.add_rows(1))
        
        save_btn = QPushButton("💾 Save All Stock")
        save_btn.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold; padding: 8px 16px;")
        save_btn.clicked.connect(self.save_stock)
        
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.reject)
        
        btn_layout.addWidget(add_row_btn)
        btn_layout.addStretch()
        btn_layout.addWidget(save_btn)
        btn_layout.addWidget(close_btn)
        
        layout.addLayout(btn_layout)
        self.setLayout(layout)

    def add_rows(self, count):
        current_rows = self.table.rowCount()
        for i in range(count):
            self.table.insertRow(current_rows + i)
            self.table.setItem(current_rows + i, 0, QTableWidgetItem(""))
            self.table.setItem(current_rows + i, 1, QTableWidgetItem(""))
            self.table.setItem(current_rows + i, 2, QTableWidgetItem("1.0"))   
            self.table.setItem(current_rows + i, 3, QTableWidgetItem("0.0")) 
            self.table.setItem(current_rows + i, 4, QTableWidgetItem("0.0")) 

    def save_stock(self):
        session = Session()
        added_count = 0
        updated_count = 0
        
        try:
            for row in range(self.table.rowCount()):
                code_item = self.table.item(row, 0)
                name_item = self.table.item(row, 1)
                qty_item = self.table.item(row, 2)
                cost_item = self.table.item(row, 3)
                mrp_item = self.table.item(row, 4)
                
                code = code_item.text().strip() if code_item else ""
                name = name_item.text().strip().title() if name_item else ""
                
                if not name and not code:
                    continue

                # Auto-fill from catalog if name missing
                unit = "piece"
                if code and not name:
                    cat_item = session.query(Item).filter_by(item_code=code).first()
                    if cat_item:
                        name = cat_item.name
                        unit = cat_item.qty_type or "piece"
                        if not mrp_item or float(mrp_item.text().strip() or 0) == 0:
                            mrp_val = cat_item.mrp
                else:
                    cat_item = session.query(Item).filter(func.lower(Item.name) == name.lower()).first()
                    if cat_item:
                        if not code: code = str(cat_item.item_code)
                        unit = cat_item.qty_type or "piece"
                    
                if not name:
                    continue
                    
                qty_text = qty_item.text().strip() if qty_item else "0"
                cost_text = cost_item.text().strip() if cost_item else "0.0"
                mrp_text = mrp_item.text().strip() if mrp_item else "0.0"
                
                try:
                    qty = float(qty_text)
                    cost = float(cost_text)
                    mrp = float(mrp_text)
                except ValueError:
                    QMessageBox.warning(self, "Error", f"Invalid numeric values for item '{name}'")
                    return

                inv = session.query(Inventory).filter(func.lower(Inventory.item_name) == name.lower()).first()
                if inv:
                    inv.quantity += qty
                    if cost > 0: inv.cost_price = cost
                    if mrp > 0: inv.mrp = mrp
                    if code: inv.item_code = code
                    if unit: inv.qty_type = unit
                    updated_count += 1
                else:
                    new_inv = Inventory(item_code=code, item_name=name, quantity=qty, cost_price=cost, mrp=mrp, qty_type=unit)
                    session.add(new_inv)
                    added_count += 1
            
            session.commit()
            QMessageBox.information(self, "Success", f"Stock Saved!\n\nNew Items: {added_count}\nUpdated Items: {updated_count}")
            self.accept()
            
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

# ==========================================
# MAIN INVENTORY TAB
# ==========================================
class InventoryTab(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_data()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)
        
        # --- TOP HEADER CONTROLS ---
        top_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search Inventory by Code or Name...")
        self.search_input.textChanged.connect(self.load_data)
        
        self.refresh_btn = QPushButton("🔄 Refresh")
        self.refresh_btn.clicked.connect(self.load_data)
        
        self.add_stock_btn = QPushButton("➕ Add Opening Stock")
        self.add_stock_btn.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        self.add_stock_btn.clicked.connect(self.open_add_stock_dialog)

        self.export_btn = QPushButton("📄 Export Stock Report (PDF)")
        self.export_btn.setStyleSheet("background-color: #f59e0b; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        self.export_btn.clicked.connect(self.export_pdf)
        
        top_layout.addWidget(self.search_input)
        top_layout.addWidget(self.refresh_btn)
        top_layout.addWidget(self.add_stock_btn)
        top_layout.addWidget(self.export_btn)
        layout.addLayout(top_layout)

        # --- TABLE ---
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels(["ID", "Item Code", "Item Name", "Available Qty", "Cost Price (₹)", "MRP (₹)", "Stock Value (₹)"])
        self.table.hideColumn(0) 
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)
        
        bottom_layout = QHBoxLayout()
        self.stock_summary_label = QLabel("Total Inventory Value: ₹0.00")
        self.stock_summary_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #10b981;")

        btn_del = QPushButton("Delete Selected Item")
        btn_del.setStyleSheet("background-color: #ef4444; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        btn_del.clicked.connect(self.delete_item)

        bottom_layout.addWidget(self.stock_summary_label)
        bottom_layout.addStretch()
        bottom_layout.addWidget(btn_del)
        layout.addLayout(bottom_layout)

    def showEvent(self, event):
        super().showEvent(event)
        self.load_data()

    def open_add_stock_dialog(self):
        dialog = AddOpeningStockDialog(self)
        if dialog.exec():
            self.load_data()

    def load_data(self):
        search_txt = self.search_input.text().strip().lower()
        session = Session()
        query = session.query(Inventory)
        
        if search_txt:
            query = query.filter(
                (Inventory.item_name.ilike(f"%{search_txt}%")) |
                (Inventory.item_code.contains(search_txt))
            )
            
        items = query.order_by(Inventory.item_name).all()
        
        self.table.setRowCount(0)
        total_val = 0.0
        for i in items:
            r = self.table.rowCount()
            self.table.insertRow(r)
            self.table.setItem(r, 0, QTableWidgetItem(str(i.id)))
            self.table.setItem(r, 1, QTableWidgetItem(str(i.item_code or "")))
            self.table.setItem(r, 2, QTableWidgetItem(i.item_name))

            unit = i.qty_type or ""
            qty_str = f"{i.quantity:g} {unit}".strip()
            self.table.setItem(r, 3, QTableWidgetItem(qty_str))
            self.table.setItem(r, 4, QTableWidgetItem(f"{i.cost_price:.2f}"))
            self.table.setItem(r, 5, QTableWidgetItem(f"{i.mrp:.2f}"))

            val = (i.quantity or 0.0) * (i.cost_price or 0.0)
            total_val += val
            self.table.setItem(r, 6, QTableWidgetItem(f"{val:.2f}"))

        self.stock_summary_label.setText(f"Total Inventory Value (at Cost): ₹{total_val:,.2f}")
        session.close()

    def delete_item(self):
        row = self.table.currentRow()
        if row == -1: return
        if QMessageBox.question(self, "Confirm", "Delete this item from inventory?") == QMessageBox.StandardButton.Yes:
            iid = self.table.item(row, 0).text()
            session = Session()
            session.query(Inventory).filter_by(id=iid).delete()
            session.commit()
            session.close()
            self.load_data()

    def export_pdf(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save Inventory Report", "Inventory_Stock_Report.pdf", "PDF Files (*.pdf)")
        if not path: return

        session = Session()
        items = session.query(Inventory).order_by(Inventory.item_name).all()
        
        headers = ['Code', 'Item Name', 'Qty in Stock', 'Cost Price', 'MRP', 'Stock Value']
        row_data = []
        total_stock_value = 0.0

        for item in items:
            qty = item.quantity or 0.0
            cost = item.cost_price or 0.0
            mrp = item.mrp or 0.0
            total_value = qty * cost
            total_stock_value += total_value

            unit = item.qty_type or ""
            qty_str = f"{qty:g} {unit}".strip()

            row_data.append([
                str(item.item_code or ""),
                item.item_name,
                qty_str,
                f"Rs. {cost:,.2f}",
                f"Rs. {mrp:,.2f}",
                f"Rs. {total_value:,.2f}"
            ])
            
        session.close()

        if row_data:
            row_data.append(["", "", "", "", "TOTAL VALUE:", f"Rs. {total_stock_value:,.2f}"])

        try:
            doc = SimpleDocTemplate(path, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=40, bottomMargin=30)
            elements = []
            styles = getSampleStyleSheet()
            
            if 'RightAlign' not in styles:
                styles.add(ParagraphStyle(name='RightAlign', parent=styles['Normal'], alignment=TA_RIGHT))

            biz = get_current_business_details()
            biz_name = biz.name if biz and biz.name else "POS System"
            biz_phone = biz.phone if biz and biz.phone else ""

            header_table_data = [
                [
                    Paragraph(f"<b><font size='16' color='#2C3E50'>{biz_name}</font></b><br/><font size='10' color='#555555'>{biz_phone}</font>", styles['Normal']),
                    Paragraph(f"<b><font size='14' color='#008CBA'>Current Inventory Report</font></b><br/><font size='10' color='#555555'><b>Generated On:</b> {datetime.now().strftime('%d-%m-%Y %I:%M %p')}</font>", styles['RightAlign'])
                ]
            ]
            
            header_table = Table(header_table_data, colWidths=[260, 275])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ]))
            elements.append(header_table)
            
            table_data = [headers] + row_data
            if len(row_data) == 0:
                table_data.append(["Your inventory is currently empty."] * len(headers))
                
            t = Table(table_data, colWidths=[55, 170, 80, 75, 75, 80])
            
            table_style = [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('ALIGN', (0, 1), (1, -1), 'LEFT'),  
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'), 
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                ('TOPPADDING', (0, 1), (-1, -1), 5),
            ]
            
            if len(row_data) > 0:
                for i in range(1, len(table_data) - 1): 
                    bg_color = colors.HexColor("#F8F9F9") if i % 2 == 0 else colors.white
                    table_style.append(('BACKGROUND', (0, i), (-1, i), bg_color))
                
                table_style.append(('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#EAEDED")))
                
            t.setStyle(TableStyle(table_style))
            elements.append(t)
            
            elements.append(Spacer(1, 15))
            elements.append(Paragraph(f"<font size='8' color='grey'>End of Report</font>", styles['Normal']))

            doc.build(elements)
            QMessageBox.information(self, "Success", "Inventory Stock Report Exported Successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Export Error", f"Failed to generate PDF:\n{str(e)}")
