import os
import base64
import configparser
import bcrypt
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QGroupBox, QFormLayout, 
                             QLineEdit, QPushButton, QMessageBox, QLabel, 
                             QHeaderView, QTableWidget, QTableWidgetItem, QHBoxLayout, 
                             QComboBox, QDialog, QScrollArea, QFrame)
from PyQt6.QtGui import QShortcut, QKeySequence, QPixmap
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtPrintSupport import QPrinterInfo
from database import Session, BusinessDetail, User
from modules.whatsapp_service import (get_whatsapp_status, get_whatsapp_qr_image, logout_whatsapp, 
                                      is_whatsapp_enabled, enable_whatsapp, disable_whatsapp)

class WhatsAppLinkDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Link WhatsApp Device")
        self.setFixedSize(380, 500)
        self.init_ui()
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.check_status_and_qr)
        self.timer.start(2000)
        self.check_status_and_qr()

    def init_ui(self):
        layout = QVBoxLayout()
        self.setLayout(layout)

        title = QLabel("<b>Scan QR to Link WhatsApp</b>")
        title.setStyleSheet("font-size: 16px; color: #128c7e; margin-top: 5px;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        instructions = QLabel(
            "1. Open <b>WhatsApp</b> on your phone.<br/>"
            "2. Tap <b>Settings</b> / 3-dots &rarr; <b>Linked Devices</b>.<br/>"
            "3. Tap <b>Link a Device</b> and point camera here:"
        )
        instructions.setStyleSheet("font-size: 12px; color: #444; margin: 6px 0;")
        layout.addWidget(instructions)

        self.qr_label = QLabel("Initializing WhatsApp QR...")
        self.qr_label.setFixedSize(280, 280)
        self.qr_label.setStyleSheet("border: 1px solid #ccc; background: white; border-radius: 8px;")
        self.qr_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.qr_label, alignment=Qt.AlignmentFlag.AlignCenter)

        self.status_label = QLabel("Waiting for scan...")
        self.status_label.setStyleSheet("font-size: 12px; color: #666; margin-top: 5px;")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status_label)

        btn_box = QHBoxLayout()
        close_btn = QPushButton("Close")
        close_btn.clicked.connect(self.close)
        btn_box.addStretch()
        btn_box.addWidget(close_btn)
        layout.addLayout(btn_box)

    def check_status_and_qr(self):
        connected, phone, has_qr = get_whatsapp_status()
        if connected:
            self.timer.stop()
            self.status_label.setText(f"✓ Connected to {phone or 'WhatsApp'}!")
            self.status_label.setStyleSheet("font-size: 13px; font-weight: bold; color: #107c10;")
            self.qr_label.setText("✓ Connected!")
            self.qr_label.setStyleSheet("border: 2px solid #107c10; font-size: 22px; color: #107c10; font-weight: bold; background: #e8f5e9;")
            QTimer.singleShot(1500, self.accept)
            return

        img_b64 = get_whatsapp_qr_image()
        if img_b64 and "," in img_b64:
            try:
                raw_b64 = img_b64.split(",", 1)[1]
                data = base64.b64decode(raw_b64)
                pixmap = QPixmap()
                pixmap.loadFromData(data)
                self.qr_label.setPixmap(pixmap.scaled(270, 270, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
                self.status_label.setText("QR active — scan now with WhatsApp camera")
            except Exception:
                pass
        else:
            self.qr_label.setText("Starting WhatsApp Bridge...\nPlease wait a moment.")

class BusinessDetailTab(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_data()

    def init_ui(self):
        # Outer Layout containing ScrollArea so all fields and tables can be smoothly scrolled
        outer_layout = QVBoxLayout(self)
        outer_layout.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(16, 12, 16, 20)
        layout.setSpacing(16)

        # --- Business Info Group ---
        biz_group = QGroupBox("Business Details")
        biz_layout = QFormLayout()
        biz_layout.setVerticalSpacing(12)
        biz_layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
        
        self.biz_name = QLineEdit(); self.biz_name.setMinimumHeight(32)
        self.biz_address = QLineEdit(); self.biz_address.setMinimumHeight(32)
        self.biz_phone = QLineEdit(); self.biz_phone.setMinimumHeight(32)
        self.biz_owner = QLineEdit(); self.biz_owner.setMinimumHeight(32)
        
        # Printer Selection & Test Print
        printer_layout = QHBoxLayout()
        self.printer_combo = QComboBox()
        self.printer_combo.setMinimumHeight(32)
        self.printer_combo.addItem("Default Windows Printer")
        self.printer_combo.addItem("No Printer (WhatsApp Only)")
        try:
            for p in QPrinterInfo.availablePrinters():
                self.printer_combo.addItem(p.printerName())
        except Exception:
            pass
            
        test_print_btn = QPushButton("🖨️ Test Print")
        test_print_btn.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        test_print_btn.clicked.connect(self.run_test_print)
        printer_layout.addWidget(self.printer_combo, 1)
        printer_layout.addWidget(test_print_btn)
            
        self.thermal_combo = QComboBox()
        self.thermal_combo.setMinimumHeight(32)
        self.thermal_combo.addItems(["80mm (Standard POS)", "58mm (Compact Roll)"])
        
        # Theme Mode Setting
        self.theme_combo = QComboBox()
        self.theme_combo.setMinimumHeight(32)
        self.theme_combo.addItem("💻 System Default (Auto)", "system")
        self.theme_combo.addItem("☀️ Light Mode", "light")
        self.theme_combo.addItem("🌙 Dark Mode", "dark")
        self.theme_combo.currentIndexChanged.connect(self.on_theme_combo_changed)
        
        biz_layout.addRow("Business Name:", self.biz_name)
        biz_layout.addRow("Address:", self.biz_address)
        biz_layout.addRow("Phone:", self.biz_phone)
        biz_layout.addRow("Owner Name:", self.biz_owner)
        biz_layout.addRow("Receipt Printer:", printer_layout)
        biz_layout.addRow("Thermal Roll Size:", self.thermal_combo) 
        biz_layout.addRow("Theme Mode:", self.theme_combo) 
        
        save_biz_btn = QPushButton("💾 Save Business Details")
        save_biz_btn.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; padding: 8px 16px; border-radius: 6px;")
        save_biz_btn.clicked.connect(self.save_business_details)
        
        # Add Ctrl+S shortcut for save business details
        save_shortcut = QShortcut(QKeySequence("Ctrl+S"), self)
        save_shortcut.activated.connect(self.save_business_details)
        
        biz_layout.addWidget(save_biz_btn)
        
        biz_group.setLayout(biz_layout)
        layout.addWidget(biz_group)

        # --- WhatsApp Integration Group ---
        wa_group = QGroupBox("WhatsApp Integration (Automatic PDF Invoice Sending)")
        wa_layout = QVBoxLayout()
        wa_layout.setSpacing(12)

        # Row 1: Start / Stop WhatsApp Messaging Control
        wa_ctrl_row = QHBoxLayout()
        wa_ctrl_row.addWidget(QLabel("<b>WhatsApp Messaging:</b>"))
        self.btn_toggle_wa_service = QPushButton()
        self.btn_toggle_wa_service.setStyleSheet("font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        self.btn_toggle_wa_service.clicked.connect(self.toggle_whatsapp_service)
        wa_ctrl_row.addWidget(self.btn_toggle_wa_service)
        wa_ctrl_row.addStretch()
        wa_layout.addLayout(wa_ctrl_row)

        # Row 2: Pairing status & action buttons
        wa_row = QHBoxLayout()
        wa_row.addWidget(QLabel("<b>WhatsApp Device:</b>"))
        self.wa_status_badge = QLabel("Checking...")
        self.wa_status_badge.setStyleSheet("font-weight: bold; padding: 4px 10px; border-radius: 4px; background: #e0e0e0;")
        wa_row.addWidget(self.wa_status_badge)
        wa_row.addStretch()

        self.btn_link_wa = QPushButton("📱 Link WhatsApp / Scan QR")
        self.btn_link_wa.setStyleSheet("background-color: #10b981; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        self.btn_link_wa.clicked.connect(self.open_whatsapp_link_dialog)

        self.btn_logout_wa = QPushButton("🚪 Logout / Disconnect")
        self.btn_logout_wa.setStyleSheet("background-color: #ef4444; color: white; font-weight: bold; padding: 6px 14px; border-radius: 6px;")
        self.btn_logout_wa.clicked.connect(self.logout_whatsapp_device)

        wa_row.addWidget(self.btn_link_wa)
        wa_row.addWidget(self.btn_logout_wa)
        wa_layout.addLayout(wa_row)

        wa_hint = QLabel("<i>One-time pairing: Session credentials are saved automatically. You do NOT have to scan again on software restart.</i>")
        wa_hint.setStyleSheet("color: #64748b; font-size: 11px; margin-top: 2px;")
        wa_layout.addWidget(wa_hint)

        wa_group.setLayout(wa_layout)
        layout.addWidget(wa_group)

        # --- User Management Group ---
        user_group = QGroupBox("User Management (Login Control)")
        user_layout = QFormLayout()
        user_layout.setVerticalSpacing(12)
        user_layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
        
        self.new_user_name = QLineEdit(); self.new_user_name.setMinimumHeight(32)
        self.new_user_pass = QLineEdit(); self.new_user_pass.setMinimumHeight(32)
        self.new_user_pass.setEchoMode(QLineEdit.EchoMode.Password)
        self.new_user_pass.setPlaceholderText("New Password")
        
        add_user_btn = QPushButton("➕ Add User / Reset Password")
        add_user_btn.setStyleSheet("background-color: #10b981; color: white; font-weight: bold; padding: 8px 16px; border-radius: 6px;")
        add_user_btn.clicked.connect(self.add_or_update_user)
        
        user_layout.addRow("Username:", self.new_user_name)
        user_layout.addRow("Password:", self.new_user_pass)
        user_layout.addWidget(add_user_btn)
        
        user_group.setLayout(user_layout)
        layout.addWidget(user_group)

        # User List Table
        self.user_table = QTableWidget()
        self.user_table.setMinimumHeight(180)
        self.user_table.setColumnCount(2)
        self.user_table.setHorizontalHeaderLabels(["ID", "Username"])
        self.user_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.user_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        layout.addWidget(self.user_table)
        
        # --- Delete User Button ---
        del_user_btn = QPushButton("🗑️ Delete Selected User")
        del_user_btn.setStyleSheet("background-color: #ef4444; color: white; font-weight: bold; padding: 8px 16px; border-radius: 6px;")
        del_user_btn.clicked.connect(self.delete_user)
        layout.addWidget(del_user_btn)

        scroll.setWidget(container)
        outer_layout.addWidget(scroll)

    def load_data(self):
        session = Session()
        
        # Load Biz Details
        biz = session.query(BusinessDetail).first()
        if biz:
            self.biz_name.setText(biz.name)
            self.biz_address.setText(biz.address)
            self.biz_phone.setText(biz.phone)
            self.biz_owner.setText(biz.owner_name if biz.owner_name else "")

        # Load Printer & Thermal Settings
        cfg = configparser.ConfigParser()
        cfg.read('config.ini')
        configured_printer = cfg.get('SETTINGS', 'printer_name', fallback='Default Windows Printer')
        idx = self.printer_combo.findText(configured_printer)
        if idx >= 0:
            self.printer_combo.setCurrentIndex(idx)

        tw = cfg.get('SETTINGS', 'thermal_width_mm', fallback='80')
        if tw == '58': self.thermal_combo.setCurrentIndex(1)
        else: self.thermal_combo.setCurrentIndex(0)

        # Load Theme Mode
        from modules.theme_manager import get_theme_mode
        saved_theme = get_theme_mode()
        t_idx = self.theme_combo.findData(saved_theme)
        if t_idx >= 0:
            self.theme_combo.blockSignals(True)
            self.theme_combo.setCurrentIndex(t_idx)
            self.theme_combo.blockSignals(False)
            
        # Load Users
        users = session.query(User).all()
        self.user_table.setRowCount(0)
        for u in users:
            r = self.user_table.rowCount()
            self.user_table.insertRow(r)
            self.user_table.setItem(r, 0, QTableWidgetItem(str(u.id)))
            self.user_table.setItem(r, 1, QTableWidgetItem(u.username))
            
        session.close()
        self.refresh_whatsapp_status()

    def save_business_details(self):
        session = Session()
        try:
            biz = session.query(BusinessDetail).first()
            if not biz:
                biz = BusinessDetail()
                session.add(biz)
            
            biz.name = self.biz_name.text()
            biz.address = self.biz_address.text()
            biz.phone = self.biz_phone.text()
            biz.owner_name = self.biz_owner.text()
            
            session.commit()

            cfg = configparser.ConfigParser()
            cfg.read('config.ini')
            if 'SETTINGS' not in cfg: cfg['SETTINGS'] = {}
            cfg['SETTINGS']['printer_name'] = self.printer_combo.currentText()
            cfg['SETTINGS']['thermal_width_mm'] = '58' if self.thermal_combo.currentIndex() == 1 else '80'
            
            selected_theme = self.theme_combo.currentData() or 'system'
            cfg['SETTINGS']['theme_mode'] = selected_theme
            
            with open('config.ini', 'w', encoding='utf-8') as f:
                cfg.write(f)

            from modules.theme_manager import apply_theme
            from PyQt6.QtWidgets import QApplication
            apply_theme(QApplication.instance(), selected_theme)

            QMessageBox.information(self, "Success", "Business Details & Settings Saved")
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

    def on_theme_combo_changed(self, index):
        selected_theme = self.theme_combo.currentData() or 'system'
        from modules.theme_manager import set_theme_mode, apply_theme
        from PyQt6.QtWidgets import QApplication
        set_theme_mode(selected_theme)
        apply_theme(QApplication.instance(), selected_theme)

    def run_test_print(self):
        from modules.pdf_generator import print_receipt_direct
        from datetime import datetime
        session = Session()
        biz = session.query(BusinessDetail).first()
        session.close()

        p_name = self.printer_combo.currentText()
        if "no printer" in p_name.lower():
            QMessageBox.information(
                self, "Printer Test", 
                "✓ 'No Printer (WhatsApp Only)' mode is active.\nBills will save and send via WhatsApp without triggering any printer dialogs."
            )
            return

        cfg = configparser.ConfigParser()
        cfg.read('config.ini')
        tw = cfg.getint('SETTINGS', 'thermal_width_mm', fallback=80)
        target_printer = None if p_name == "Default Windows Printer" else p_name

        test_data = {
            'bill_id': 'TEST-PRINT',
            'date_time': datetime.now(),
            'customer_name': 'Test Print Sample',
            'mobile_number': '',
            'items': [
                {'sr_no': 1, 'item_code': '01', 'item_name': 'Sample Receipt Test Item', 'quantity': 1.0, 'qty_type': 'piece', 'rate': 10.0, 'amount': 10.0}
            ],
            'subtotal': 10.0,
            'discount_percent': 0.0,
            'discount_amount': 0.0,
            'net_total': 10.0
        }

        success, msg = print_receipt_direct(test_data, biz, paper_width_mm=tw, printer_name=target_printer)
        target = p_name
        if success:
            if "pdf" in target.lower():
                QMessageBox.information(
                    self, "Printer Test", 
                    f"✓ Test receipt dispatched to '{target}'!\n\n"
                    f"• The Windows 'Save Print Output As' dialog is opening now.\n"
                    f"• Save the file to inspect the thermal print layout.\n"
                    f"• You can also view live print details in your terminal console."
                )
            else:
                QMessageBox.information(
                    self, "Printer Test", 
                    f"✓ Test receipt sent successfully to:\n'{target}'\n\n"
                    f"• Physical thermal printer spooled. Check terminal logs for details."
                )
        else:
            QMessageBox.critical(self, "Printer Test Failed", f"Could not print to '{target}':\n{msg}")

    def add_or_update_user(self):
        username = self.new_user_name.text().strip()
        password = self.new_user_pass.text().strip()
        
        if not username or not password:
            QMessageBox.warning(self, "Error", "Username and Password required")
            return
            
        session = Session()
        try:
            user = session.query(User).filter_by(username=username).first()
            
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            if user:
                user.password_hash = hashed
                msg = "Password Updated"
            else:
                user = User(username=username, password_hash=hashed)
                session.add(user)
                msg = "User Created"
                
            session.commit()
            QMessageBox.information(self, "Success", msg)
            self.new_user_name.clear()
            self.new_user_pass.clear()
            self.load_data()
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Error", str(e))
        finally:
            session.close()

    def delete_user(self):
        row = self.user_table.currentRow()
        if row == -1:
            return
        
        uid = self.user_table.item(row, 0).text()
        username = self.user_table.item(row, 1).text()
        
        if username == "admin":
             if QMessageBox.question(self, "Warning", "Deleting the 'admin' user might lock you out if no other users exist. Continue?") != QMessageBox.StandardButton.Yes:
                 return

        if QMessageBox.question(self, "Confirm", f"Are you sure you want to delete user '{username}'?") == QMessageBox.StandardButton.Yes:
            session = Session()
            try:
                session.query(User).filter_by(id=uid).delete()
                session.commit()
                self.load_data()
            except Exception as e:
                session.rollback()
                QMessageBox.critical(self, "Error", str(e))
            finally:
                session.close()

    def showEvent(self, event):
        super().showEvent(event)
        self.refresh_whatsapp_status()

    def refresh_whatsapp_status(self):
        enabled = is_whatsapp_enabled()
        if enabled:
            self.btn_toggle_wa_service.setText("⏹️ Stop WhatsApp Messaging")
            self.btn_toggle_wa_service.setStyleSheet("background-color: #d83b01; color: white; font-weight: bold; padding: 6px 14px;")
            self.btn_toggle_wa_service.setToolTip("Click to STOP sending WhatsApp invoices")
        else:
            self.btn_toggle_wa_service.setText("▶️ Start WhatsApp Messaging")
            self.btn_toggle_wa_service.setStyleSheet("background-color: #107c10; color: white; font-weight: bold; padding: 6px 14px;")
            self.btn_toggle_wa_service.setToolTip("Click to START sending WhatsApp invoices")

        if not enabled:
            self.wa_status_badge.setText("⏸️ Service Stopped (Disabled)")
            self.wa_status_badge.setStyleSheet("font-weight: bold; color: white; background: #767676; padding: 4px 10px; border-radius: 4px;")
            self.btn_link_wa.setEnabled(False)
            self.btn_logout_wa.setEnabled(False)
            return

        connected, phone, has_qr = get_whatsapp_status()
        if connected:
            self.wa_status_badge.setText(f"🟢 Connected ({phone or 'Active'})")
            self.wa_status_badge.setStyleSheet("font-weight: bold; color: white; background: #107c10; padding: 4px 10px; border-radius: 4px;")
            self.btn_link_wa.setEnabled(False)
            self.btn_logout_wa.setEnabled(True)
        else:
            self.wa_status_badge.setText("🔴 Not Linked / Scan Required")
            self.wa_status_badge.setStyleSheet("font-weight: bold; color: white; background: #d32f2f; padding: 4px 10px; border-radius: 4px;")
            self.btn_link_wa.setEnabled(True)
            self.btn_logout_wa.setEnabled(False)

    def toggle_whatsapp_service(self):
        if is_whatsapp_enabled():
            disable_whatsapp()
            QMessageBox.information(
                self, "WhatsApp Stopped", 
                "⏹️ WhatsApp messaging has been STOPPED.\nBills will save without sending WhatsApp messages."
            )
        else:
            enable_whatsapp()
            QMessageBox.information(
                self, "WhatsApp Started", 
                "▶️ WhatsApp messaging has been STARTED.\nBills with customer mobile numbers will now send invoices automatically."
            )
        self.refresh_whatsapp_status()

    def open_whatsapp_link_dialog(self):
        dlg = WhatsAppLinkDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.refresh_whatsapp_status()
            QMessageBox.information(self, "WhatsApp Linked", "✓ WhatsApp linked successfully!\nYour billing software will now send invoices automatically.")
        else:
            self.refresh_whatsapp_status()

    def logout_whatsapp_device(self):
        if QMessageBox.question(
            self, "Confirm Disconnect", 
            "Are you sure you want to disconnect WhatsApp?\nAutomatic invoice dispatch will stop until paired again.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        ) == QMessageBox.StandardButton.Yes:
            success = logout_whatsapp()
            self.refresh_whatsapp_status()
            if success:
                QMessageBox.information(self, "Disconnected", "WhatsApp unlinked successfully. You can link a new device anytime.")
            else:
                QMessageBox.warning(self, "Status", "WhatsApp session cleared.")