import sys
import os
import logging
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QTabWidget, QLabel, QDialog, 
                             QLineEdit, QPushButton, QMessageBox, QFormLayout, QHBoxLayout, QComboBox, QFrame)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon, QFont

from modules.logging_config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

from database import setup_database, Session, User
import bcrypt

# Import Theme Manager
from modules.theme_manager import apply_theme, get_theme_mode, set_theme_mode, get_effective_theme

# Import All Tabs
from tabs.sell_tab import SellTab
from tabs.item_tab import ItemTab
from tabs.purchase_tab import PurchaseTab
from tabs.expenditure_tab import ExpenditureTab
from tabs.find_bill_tab import FindBillTab
from tabs.inventory_tab import InventoryTab
from tabs.portfolio_tab import PortfolioTab
from tabs.dashboard_tab import DashboardTab
from tabs.business_detail_tab import BusinessDetailTab
from tabs.analytics_tab import AnalyticsTab 
from tabs.customer_tab import CustomerTab
from modules.whatsapp_service import start_whatsapp_service, stop_whatsapp_service

class LoginDialog(QDialog):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("POS Login")
        self.setFixedSize(360, 260)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowContextHelpButtonHint)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(14)
        
        # Header Badge
        header_layout = QVBoxLayout()
        title = QLabel("Convenience Store POS")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_font = QFont("Segoe UI", 16, QFont.Weight.Bold)
        title.setFont(title_font)
        
        subtitle = QLabel("Please enter your credentials to login")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setStyleSheet("color: #64748b; font-size: 12px;")
        
        header_layout.addWidget(title)
        header_layout.addWidget(subtitle)
        layout.addLayout(header_layout)
        
        # Form
        form = QFormLayout()
        form.setSpacing(10)
        
        self.user = QLineEdit()
        self.user.setPlaceholderText("Username (e.g. admin)")
        self.user.setMinimumHeight(34)
        
        self.pwd = QLineEdit()
        self.pwd.setPlaceholderText("Password")
        self.pwd.setEchoMode(QLineEdit.EchoMode.Password)
        self.pwd.setMinimumHeight(34)
        
        form.addRow("Username:", self.user)
        form.addRow("Password:", self.pwd)
        layout.addLayout(form)
        
        # Login Button
        self.btn = QPushButton("Log In to POS")
        self.btn.setMinimumHeight(38)
        self.btn.setStyleSheet("background-color: #0284c7; color: white; font-weight: bold; font-size: 13px; border-radius: 6px;")
        self.btn.clicked.connect(self.check_login)
        self.pwd.returnPressed.connect(self.check_login)
        self.user.returnPressed.connect(self.check_login)
        layout.addWidget(self.btn)
        
        self.setLayout(layout)

    def check_login(self):
        u = self.user.text().strip()
        p = self.pwd.text()
        session = Session()
        user = session.query(User).filter_by(username=u).first()
        session.close()
        
        if user and bcrypt.checkpw(p.encode(), user.password_hash.encode()):
            self.accept()
        else:
            QMessageBox.warning(self, "Login Failed", "Invalid username or password. Please try again.")

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Convenience Store POS System")
        self.resize(1260, 840)
        
        central = QWidget()
        central.setObjectName("centralWidget")
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(8)
        
        # Modern Top Header
        header = QHBoxLayout()
        header.setContentsMargins(4, 2, 4, 6)
        
        title_box = QVBoxLayout()
        title_box.setSpacing(1)
        self.title_label = QLabel("🏪 Convenience Store POS & Inventory")
        self.title_label.setObjectName("appTitleLabel")
        self.title_label.setFont(QFont("Segoe UI", 15, QFont.Weight.Bold))
        
        self.sub_label = QLabel("Retail Point of Sale  •  Thermal ESC/POS  •  WhatsApp Service  •  v2.0")
        self.sub_label.setObjectName("appSubLabel")
        self.sub_label.setStyleSheet("font-size: 11px; color: #64748b;")
        
        title_box.addWidget(self.title_label)
        title_box.addWidget(self.sub_label)
        header.addLayout(title_box)
        
        header.addStretch()
        
        # Shortcut Hint Pill
        shortcut_pill = QLabel("⌨️ Shortcuts: F1 (POS) • F5 (Refresh) • Del (Remove) • Ctrl+S (Save)")
        shortcut_pill.setStyleSheet("""
            background-color: rgba(2, 132, 199, 0.08);
            border: 1px solid rgba(2, 132, 199, 0.25);
            border-radius: 12px;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 600;
            color: #0284c7;
        """)
        header.addWidget(shortcut_pill)
        
        # Theme Mode Selector
        theme_box = QHBoxLayout()
        theme_box.setSpacing(6)
        theme_icon = QLabel("🎨 Theme:")
        theme_icon.setStyleSheet("font-size: 12px; font-weight: 600;")
        
        self.theme_combo = QComboBox()
        self.theme_combo.setMinimumWidth(160)
        self.theme_combo.setMinimumHeight(30)
        self.theme_combo.view().setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.theme_combo.addItem("💻 System (Auto)", "system")
        self.theme_combo.addItem("☀️ Light Mode", "light")
        self.theme_combo.addItem("🌙 Dark Mode", "dark")
        
        saved_mode = get_theme_mode()
        idx = self.theme_combo.findData(saved_mode)
        if idx >= 0:
            self.theme_combo.setCurrentIndex(idx)
        self.theme_combo.currentIndexChanged.connect(self.on_theme_changed)
        
        theme_box.addWidget(theme_icon)
        theme_box.addWidget(self.theme_combo)
        header.addLayout(theme_box)
        
        layout.addLayout(header)
        
        # Tab Widget
        self.tabs = QTabWidget()
        self.tabs.setObjectName("mainTabWidget")
        
        # Initialize Tabs
        self.tab_sell = SellTab()
        self.tab_item = ItemTab()
        self.tab_purchase = PurchaseTab()
        self.tab_expense = ExpenditureTab()
        self.tab_find = FindBillTab()
        self.tab_inventory = InventoryTab()
        self.tab_analytics = AnalyticsTab() 
        self.tab_portfolio = PortfolioTab()
        self.tab_dash = DashboardTab()
        self.tab_biz = BusinessDetailTab()
        self.tab_customer = CustomerTab()

        self.tab_find.edit_bill_signal.connect(self.open_edit_bill)

        # Add All 11 Tabs
        self.tabs.addTab(self.tab_sell, "💰 POS / Sell")
        self.tabs.addTab(self.tab_item, "🏷️ Items")
        self.tabs.addTab(self.tab_purchase, "🛒 Purchase")
        self.tabs.addTab(self.tab_expense, "💸 Expenditure")
        self.tabs.addTab(self.tab_find, "🔍 Find Bill")
        self.tabs.addTab(self.tab_inventory, "📦 Inventory")
        self.tabs.addTab(self.tab_analytics, "📈 Analytics") 
        self.tabs.addTab(self.tab_portfolio, "📊 Portfolio")
        self.tabs.addTab(self.tab_dash, "🏠 Dashboard")
        self.tabs.addTab(self.tab_customer, "👥 Customers")
        self.tabs.addTab(self.tab_biz, "⚙️ Settings")
        
        layout.addWidget(self.tabs)
        self.tabs.currentChanged.connect(self.on_tab_change)

        # Notify initial theme to tabs
        effective = get_effective_theme()
        self.propagate_theme_to_tabs(effective)

        # Start WhatsApp background service silently only if enabled by user
        from modules.whatsapp_service import is_whatsapp_enabled
        if is_whatsapp_enabled():
            start_whatsapp_service()
        else:
            print("[WHATSAPP LOG] WhatsApp messaging is currently STOPPED/DISABLED in settings.")

    def on_theme_changed(self, index):
        mode = self.theme_combo.currentData()
        if not mode:
            mode = "system"
        set_theme_mode(mode)
        app = QApplication.instance()
        effective = apply_theme(app, mode)
        self.propagate_theme_to_tabs(effective)

    def propagate_theme_to_tabs(self, effective_theme: str):
        # Notify any tab that has specific chart or canvas adjustments
        for i in range(self.tabs.count()):
            tab = self.tabs.widget(i)
            if hasattr(tab, "apply_theme_mode"):
                try:
                    tab.apply_theme_mode(effective_theme)
                except Exception as e:
                    logger.debug(f"Error applying theme to tab {tab}: {e}")

    def closeEvent(self, event):
        # Gracefully stop WhatsApp background service on application close
        stop_whatsapp_service()
        event.accept()

    def keyPressEvent(self, event):
        current_tab = self.tabs.currentWidget()
        
        if event.key() == Qt.Key.Key_F1:
            self.tabs.setCurrentWidget(self.tab_sell)
            return

        if event.key() == Qt.Key.Key_F5:
            if current_tab == self.tab_sell:
                self.tab_sell.reset_form()
            elif current_tab == self.tab_expense:
                self.tab_expense.load_data()
            elif current_tab == self.tab_portfolio:
                self.tab_portfolio.calculate("all")
            else:
                if hasattr(current_tab, 'load_data'): current_tab.load_data()
                elif hasattr(current_tab, 'refresh_data'): current_tab.refresh_data()
                elif hasattr(current_tab, 'load_history'): current_tab.load_history()
        
        elif event.key() == Qt.Key.Key_Delete:
            if current_tab == self.tab_sell:
                self.tab_sell.delete_item()
            elif current_tab == self.tab_item:
                self.tab_item.delete_item()
            elif current_tab == self.tab_purchase:
                self.tab_purchase.delete_history_item()
            elif current_tab == self.tab_expense:
                self.tab_expense.delete_selected()
            elif current_tab == self.tab_find:
                self.tab_find.delete_bill()
            elif current_tab == self.tab_inventory:
                self.tab_inventory.delete_item()

        elif event.key() == Qt.Key.Key_Return or event.key() == Qt.Key.Key_Enter:
            if hasattr(current_tab, 'save_purchase'): current_tab.save_purchase()
            elif hasattr(current_tab, 'save_expense'): current_tab.save_expense()
            elif hasattr(current_tab, 'search_bills'): current_tab.search_bills()
            
        super().keyPressEvent(event)

    def refresh_current_tab(self):
        w = self.tabs.currentWidget()
        if hasattr(w, 'refresh_data'): w.refresh_data()
        elif hasattr(w, 'load_data'): w.load_data()
        elif hasattr(w, 'load_history'): w.load_history()
        elif hasattr(w, 'search_bills'): w.search_bills()
        elif hasattr(w, 'update_chart'): w.update_chart()

    def open_edit_bill(self, bill_id):
        self.tabs.setCurrentWidget(self.tab_sell)
        self.tab_sell.load_bill_for_edit(bill_id)

    def on_tab_change(self, index):
        self.refresh_current_tab()

if __name__ == "__main__":
    try:
        import ctypes
        myappid = 'mycompany.possoftware.version2' 
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception:
        pass

    app = QApplication(sys.argv)
    
    # Initialize and apply modern theme (Light/Dark/System)
    apply_theme(app)

    setup_database()
    
    if LoginDialog().exec() == QDialog.DialogCode.Accepted:
        win = MainWindow()
        win.showMaximized()
        sys.exit(app.exec())
