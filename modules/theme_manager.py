"""
Theme Manager Module for POS & Inventory System
Supports Light Mode, Dark Mode, and Automatic System Theme Detection (Windows 10/11)
"""

import os
import configparser
import logging
from PyQt6.QtWidgets import QApplication, QCalendarWidget
from PyQt6.QtGui import QPalette, QColor, QFont
from PyQt6.QtCore import Qt, QObject, QEvent

logger = logging.getLogger(__name__)

class CalendarConfigFilter(QObject):
    """Global filter to ensure modern layout on all pop-up and inline calendar widgets."""
    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.Show and isinstance(obj, QCalendarWidget):
            try:
                obj.setVerticalHeaderFormat(QCalendarWidget.VerticalHeaderFormat.NoVerticalHeader)
            except Exception:
                pass
        return super().eventFilter(obj, event)

_calendar_filter_installed = False

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.ini")
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets").replace("\\", "/")

def is_system_dark() -> bool:
    """Detect if Windows system theme is set to Dark Mode."""
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
        )
        val, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        return val == 0
    except Exception:
        return False

def get_theme_mode() -> str:
    """Get saved theme preference: 'system', 'light', or 'dark'."""
    try:
        config = configparser.ConfigParser()
        if os.path.exists(CONFIG_PATH):
            config.read(CONFIG_PATH, encoding="utf-8")
            if config.has_option("SETTINGS", "theme_mode"):
                mode = config.get("SETTINGS", "theme_mode").lower().strip()
                if mode in ("system", "light", "dark"):
                    return mode
    except Exception as e:
        logger.warning(f"Failed to read theme preference from config.ini: {e}")
    return "system"

def set_theme_mode(mode: str):
    """Save theme preference: 'system', 'light', or 'dark' to config.ini."""
    if mode not in ("system", "light", "dark"):
        return
    try:
        config = configparser.ConfigParser()
        if os.path.exists(CONFIG_PATH):
            config.read(CONFIG_PATH, encoding="utf-8")
        if not config.has_section("SETTINGS"):
            config.add_section("SETTINGS")
        config.set("SETTINGS", "theme_mode", mode)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            config.write(f)
    except Exception as e:
        logger.error(f"Failed to save theme preference: {e}")

def get_effective_theme(mode: str = None) -> str:
    """Returns 'light' or 'dark' after resolving 'system'."""
    if mode is None:
        mode = get_theme_mode()
    if mode == "system":
        return "dark" if is_system_dark() else "light"
    return mode if mode in ("light", "dark") else "light"

def get_palette(theme: str) -> QPalette:
    """Generates consistent Qt Fusion palette for the theme."""
    pal = QPalette()
    if theme == "dark":
        # Dark Modern Slate Palette
        pal.setColor(QPalette.ColorRole.Window, QColor("#0f172a"))          # Deep slate background
        pal.setColor(QPalette.ColorRole.WindowText, QColor("#f8fafc"))      # White/Off-white text
        pal.setColor(QPalette.ColorRole.Base, QColor("#1e293b"))            # Input/Card background
        pal.setColor(QPalette.ColorRole.AlternateBase, QColor("#182234"))   # Alternating row background
        pal.setColor(QPalette.ColorRole.ToolTipBase, QColor("#1e293b"))
        pal.setColor(QPalette.ColorRole.ToolTipText, QColor("#f8fafc"))
        pal.setColor(QPalette.ColorRole.Text, QColor("#f8fafc"))
        pal.setColor(QPalette.ColorRole.Button, QColor("#1e293b"))
        pal.setColor(QPalette.ColorRole.ButtonText, QColor("#f8fafc"))
        pal.setColor(QPalette.ColorRole.BrightText, QColor("#ef4444"))
        pal.setColor(QPalette.ColorRole.Link, QColor("#38bdf8"))
        pal.setColor(QPalette.ColorRole.Highlight, QColor("#0284c7"))
        pal.setColor(QPalette.ColorRole.HighlightedText, QColor("#ffffff"))
    else:
        # Light Clean Slate Palette
        pal.setColor(QPalette.ColorRole.Window, QColor("#f8fafc"))          # Clean slate 50
        pal.setColor(QPalette.ColorRole.WindowText, QColor("#0f172a"))      # Deep slate text
        pal.setColor(QPalette.ColorRole.Base, QColor("#ffffff"))            # Pure white input/card
        pal.setColor(QPalette.ColorRole.AlternateBase, QColor("#f1f5f9"))   # Alternating row background
        pal.setColor(QPalette.ColorRole.ToolTipBase, QColor("#ffffff"))
        pal.setColor(QPalette.ColorRole.ToolTipText, QColor("#0f172a"))
        pal.setColor(QPalette.ColorRole.Text, QColor("#0f172a"))
        pal.setColor(QPalette.ColorRole.Button, QColor("#f1f5f9"))
        pal.setColor(QPalette.ColorRole.ButtonText, QColor("#0f172a"))
        pal.setColor(QPalette.ColorRole.BrightText, QColor("#dc2626"))
        pal.setColor(QPalette.ColorRole.Link, QColor("#0284c7"))
        pal.setColor(QPalette.ColorRole.Highlight, QColor("#0284c7"))
        pal.setColor(QPalette.ColorRole.HighlightedText, QColor("#ffffff"))
    return pal

def get_qss(theme: str) -> str:
    """Returns complete, modern QSS styling for all tabs and dialogs."""
    check_icon = f"{ASSETS_DIR}/check_white.png"
    chevron_down = f"{ASSETS_DIR}/chevron_down_light.png" if theme == "dark" else f"{ASSETS_DIR}/chevron_down_dark.png"
    chevron_left = f"{ASSETS_DIR}/chevron_left_white.png"
    chevron_right = f"{ASSETS_DIR}/chevron_right_white.png"

    if theme == "dark":
        return f"""
        /* ================= DARK MODERN THEME ================= */
        QWidget {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            font-size: 13px;
            color: #f8fafc;
        }}

        QMainWindow, QDialog {{
            background-color: #0f172a;
        }}

        /* Central Widget & Tabs */
        QTabWidget::pane {{
            border: 1px solid #334155;
            background-color: #1e293b;
            border-radius: 8px;
            margin-top: -1px;
        }}

        QTabBar::tab {{
            background-color: #0f172a;
            color: #94a3b8;
            border: 1px solid #334155;
            border-bottom: none;
            padding: 9px 18px;
            margin-right: 3px;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            font-weight: 600;
        }}

        QTabBar::tab:hover {{
            background-color: #1e293b;
            color: #f8fafc;
        }}

        QTabBar::tab:selected {{
            background-color: #1e293b;
            color: #38bdf8;
            border-top: 3px solid #0284c7;
            font-weight: bold;
        }}

        /* Scroll Area */
        QScrollArea {{
            background-color: transparent;
            border: none;
        }}

        /* Group Boxes */
        QGroupBox {{
            font-weight: bold;
            border: 1px solid #334155;
            border-radius: 8px;
            margin-top: 14px;
            padding-top: 16px;
            padding-left: 10px;
            padding-right: 10px;
            padding-bottom: 10px;
            background-color: #1e293b;
            color: #38bdf8;
        }}

        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 14px;
            padding: 0 6px;
            color: #38bdf8;
            font-size: 13px;
        }}

        /* Form Inputs (Comfortable height & proper padding to prevent vertical text cut-off) */
        QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox, QDateEdit, QDateTimeEdit {{
            background-color: #0f172a;
            border: 1px solid #475569;
            border-radius: 6px;
            padding: 2px 8px;
            min-height: 28px;
            color: #f8fafc;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
        }}

        QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, 
        QSpinBox:focus, QDoubleSpinBox:focus, QDateEdit:focus {{
            border: 1.5px solid #38bdf8;
            background-color: #0b1120;
        }}

        QLineEdit:disabled, QSpinBox:disabled, QDoubleSpinBox:disabled, QDateEdit:disabled {{
            background-color: #1e293b;
            color: #64748b;
            border-color: #334155;
        }}

        /* Dropdowns (QComboBox) */
        QComboBox {{
            background-color: #0f172a;
            border: 1px solid #475569;
            border-radius: 6px;
            padding: 2px 8px;
            padding-right: 28px;
            min-height: 28px;
            color: #f8fafc;
        }}

        QComboBox:hover {{
            border-color: #64748b;
        }}

        QComboBox:focus {{
            border: 1.5px solid #38bdf8;
        }}

        QComboBox::drop-down {{
            subcontrol-origin: padding;
            subcontrol-position: top right;
            width: 26px;
            border: none;
            background: transparent;
        }}

        QComboBox::down-arrow {{
            image: url({chevron_down});
            width: 10px;
            height: 10px;
        }}

        /* Clean Dropdown List without ugly focus outline */
        QComboBox QAbstractItemView {{
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 4px;
            outline: 0px;
            color: #f8fafc;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
        }}

        QComboBox QAbstractItemView::item {{
            min-height: 30px;
            padding: 4px 10px;
            border-radius: 4px;
            color: #f8fafc;
        }}

        QComboBox QAbstractItemView::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
        }}

        QComboBox QAbstractItemView::item:hover {{
            background-color: #334155;
            color: #f8fafc;
        }}

        /* Tables */
        QTableWidget, QTableView {{
            background-color: #1e293b;
            alternate-background-color: #182234;
            border: 1px solid #334155;
            border-radius: 6px;
            gridline-color: #334155;
            color: #f8fafc;
            selection-background-color: #0369a1;
            selection-color: #ffffff;
        }}

        QHeaderView::section {{
            background-color: #0f172a;
            color: #cbd5e1;
            font-weight: 600;
            border: none;
            border-bottom: 2px solid #334155;
            border-right: 1px solid #334155;
            padding: 7px 10px;
        }}

        QTableCornerButton::section {{
            background-color: #0f172a;
            border: none;
            border-bottom: 2px solid #334155;
        }}

        /* Buttons (Base) */
        QPushButton {{
            background-color: #334155;
            color: #f8fafc;
            border: 1px solid #475569;
            border-radius: 6px;
            padding: 6px 14px;
            font-weight: 600;
            min-height: 22px;
        }}

        QPushButton:hover {{
            background-color: #475569;
            border-color: #64748b;
        }}

        QPushButton:pressed {{
            background-color: #1e293b;
        }}

        QPushButton:disabled {{
            background-color: #1e293b;
            color: #64748b;
            border-color: #334155;
        }}

        /* Checkbox & Radio (with clear checkmark icon!) */
        QCheckBox, QRadioButton {{
            spacing: 8px;
            color: #f8fafc;
        }}

        QCheckBox::indicator, QRadioButton::indicator {{
            width: 18px;
            height: 18px;
            border: 1.5px solid #475569;
            border-radius: 4px;
            background-color: #0f172a;
        }}

        QCheckBox::indicator:hover, QRadioButton::indicator:hover {{
            border-color: #38bdf8;
        }}

        QCheckBox::indicator:checked {{
            background-color: #0284c7;
            border-color: #0284c7;
            image: url({check_icon});
        }}

        /* Scrollbars */
        QScrollBar:vertical {{
            background: #0f172a;
            width: 10px;
            margin: 0px;
            border-radius: 5px;
        }}

        QScrollBar::handle:vertical {{
            background: #475569;
            min-height: 20px;
            border-radius: 5px;
        }}

        QScrollBar::handle:vertical:hover {{
            background: #64748b;
        }}

        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical,
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{
            background: none;
            height: 0px;
        }}

        QScrollBar:horizontal {{
            background: #0f172a;
            height: 10px;
            margin: 0px;
            border-radius: 5px;
        }}

        QScrollBar::handle:horizontal {{
            background: #475569;
            min-width: 20px;
            border-radius: 5px;
        }}

        QScrollBar::handle:horizontal:hover {{
            background: #64748b;
        }}

        QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal,
        QScrollBar::add-page:horizontal, QScrollBar::sub-page:horizontal {{
            background: none;
            width: 0px;
        }}

        /* Tooltips */
        QToolTip {{
            background-color: #0f172a;
            color: #f8fafc;
            border: 1px solid #475569;
            padding: 5px 8px;
            border-radius: 4px;
        }}

        /* ================= CALENDAR WIDGET (DARK) ================= */
        QCalendarWidget {{
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
        }}

        QCalendarWidget QWidget#qt_calendar_navigationbar {{
            background-color: #0f172a;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            min-height: 38px;
            padding: 2px 6px;
        }}

        QCalendarWidget QToolButton {{
            color: #f8fafc;
            font-size: 13px;
            font-weight: bold;
            background-color: transparent;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            margin: 2px;
        }}

        QCalendarWidget QToolButton:hover {{
            background-color: rgba(255, 255, 255, 0.15);
        }}

        QCalendarWidget QToolButton::menu-indicator {{
            image: none;
            width: 0px;
        }}

        QCalendarWidget #qt_calendar_prevmonth {{
            qproperty-icon: none;
            image: url({chevron_left});
            width: 14px;
            height: 14px;
        }}

        QCalendarWidget #qt_calendar_nextmonth {{
            qproperty-icon: none;
            image: url({chevron_right});
            width: 14px;
            height: 14px;
        }}

        QCalendarWidget QSpinBox {{
            background-color: rgba(255, 255, 255, 0.15);
            color: #f8fafc;
            font-size: 13px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            padding: 2px 6px;
            margin: 2px;
        }}

        QCalendarWidget QSpinBox::up-button, QCalendarWidget QSpinBox::down-button {{
            width: 0px;
            height: 0px;
            border: none;
        }}

        QCalendarWidget QMenu {{
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 4px;
            color: #f8fafc;
        }}

        QCalendarWidget QMenu::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
        }}

        QCalendarWidget QTableView {{
            background-color: #1e293b;
            alternate-background-color: #1e293b;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
            border: none;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            outline: 0px;
            color: #f8fafc;
        }}

        QCalendarWidget QTableView::item {{
            border-radius: 4px;
            padding: 4px;
        }}

        QCalendarWidget QTableView::item:hover {{
            background-color: #334155;
            color: #f8fafc;
        }}

        QCalendarWidget QTableView::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
            font-weight: bold;
        }}

        QCalendarWidget QHeaderView::section {{
            background-color: #0f172a;
            color: #94a3b8;
            font-weight: bold;
            font-size: 11px;
            border: none;
            border-bottom: 1px solid #334155;
            padding: 5px 0px;
        }}
        """
    else:
        return f"""
        /* ================= LIGHT MODERN THEME ================= */
        QWidget {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            font-size: 13px;
            color: #0f172a;
        }}

        QMainWindow, QDialog {{
            background-color: #f8fafc;
        }}

        /* Central Widget & Tabs */
        QTabWidget::pane {{
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            border-radius: 8px;
            margin-top: -1px;
        }}

        QTabBar::tab {{
            background-color: #f1f5f9;
            color: #64748b;
            border: 1px solid #e2e8f0;
            border-bottom: none;
            padding: 9px 18px;
            margin-right: 3px;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            font-weight: 600;
        }}

        QTabBar::tab:hover {{
            background-color: #e2e8f0;
            color: #0f172a;
        }}

        QTabBar::tab:selected {{
            background-color: #ffffff;
            color: #0284c7;
            border-top: 3px solid #0284c7;
            font-weight: bold;
        }}

        /* Scroll Area */
        QScrollArea {{
            background-color: transparent;
            border: none;
        }}

        /* Group Boxes */
        QGroupBox {{
            font-weight: bold;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-top: 14px;
            padding-top: 16px;
            padding-left: 10px;
            padding-right: 10px;
            padding-bottom: 10px;
            background-color: #ffffff;
            color: #0369a1;
        }}

        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 14px;
            padding: 0 6px;
            color: #0369a1;
            font-size: 13px;
        }}

        /* Form Inputs (Comfortable height & proper padding to prevent vertical text cut-off) */
        QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox, QDateEdit, QDateTimeEdit {{
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 2px 8px;
            min-height: 28px;
            color: #0f172a;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
        }}

        QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, 
        QSpinBox:focus, QDoubleSpinBox:focus, QDateEdit:focus {{
            border: 1.5px solid #0284c7;
            background-color: #f8fafc;
        }}

        QLineEdit:disabled, QSpinBox:disabled, QDoubleSpinBox:disabled, QDateEdit:disabled {{
            background-color: #f1f5f9;
            color: #94a3b8;
            border-color: #e2e8f0;
        }}

        /* Dropdowns (QComboBox) */
        QComboBox {{
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 2px 8px;
            padding-right: 28px;
            min-height: 28px;
            color: #0f172a;
        }}

        QComboBox:hover {{
            border-color: #94a3b8;
        }}

        QComboBox:focus {{
            border: 1.5px solid #0284c7;
        }}

        QComboBox::drop-down {{
            subcontrol-origin: padding;
            subcontrol-position: top right;
            width: 26px;
            border: none;
            background: transparent;
        }}

        QComboBox::down-arrow {{
            image: url({chevron_down});
            width: 10px;
            height: 10px;
        }}

        /* Clean Dropdown List without ugly focus outline */
        QComboBox QAbstractItemView {{
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 4px;
            outline: 0px;
            color: #0f172a;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
        }}

        QComboBox QAbstractItemView::item {{
            min-height: 30px;
            padding: 4px 10px;
            border-radius: 4px;
            color: #0f172a;
        }}

        QComboBox QAbstractItemView::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
        }}

        QComboBox QAbstractItemView::item:hover {{
            background-color: #f1f5f9;
            color: #0f172a;
        }}

        /* Tables */
        QTableWidget, QTableView {{
            background-color: #ffffff;
            alternate-background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            gridline-color: #e2e8f0;
            color: #0f172a;
            selection-background-color: #e0f2fe;
            selection-color: #0369a1;
        }}

        QHeaderView::section {{
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            border: none;
            border-bottom: 2px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            padding: 7px 10px;
        }}

        QTableCornerButton::section {{
            background-color: #f1f5f9;
            border: none;
            border-bottom: 2px solid #e2e8f0;
        }}

        /* Buttons (Base) */
        QPushButton {{
            background-color: #f1f5f9;
            color: #1e293b;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 14px;
            font-weight: 600;
            min-height: 22px;
        }}

        QPushButton:hover {{
            background-color: #e2e8f0;
            border-color: #94a3b8;
        }}

        QPushButton:pressed {{
            background-color: #cbd5e1;
        }}

        QPushButton:disabled {{
            background-color: #f1f5f9;
            color: #94a3b8;
            border-color: #e2e8f0;
        }}

        /* Checkbox & Radio (with clear checkmark icon!) */
        QCheckBox, QRadioButton {{
            spacing: 8px;
            color: #0f172a;
        }}

        QCheckBox::indicator, QRadioButton::indicator {{
            width: 18px;
            height: 18px;
            border: 1.5px solid #cbd5e1;
            border-radius: 4px;
            background-color: #ffffff;
        }}

        QCheckBox::indicator:hover, QRadioButton::indicator:hover {{
            border-color: #0284c7;
        }}

        QCheckBox::indicator:checked {{
            background-color: #0284c7;
            border-color: #0284c7;
            image: url({check_icon});
        }}

        /* Scrollbars */
        QScrollBar:vertical {{
            background: #f8fafc;
            width: 10px;
            margin: 0px;
            border-radius: 5px;
        }}

        QScrollBar::handle:vertical {{
            background: #cbd5e1;
            min-height: 20px;
            border-radius: 5px;
        }}

        QScrollBar::handle:vertical:hover {{
            background: #94a3b8;
        }}

        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical,
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{
            background: none;
            height: 0px;
        }}

        QScrollBar:horizontal {{
            background: #f8fafc;
            height: 10px;
            margin: 0px;
            border-radius: 5px;
        }}

        QScrollBar::handle:horizontal {{
            background: #cbd5e1;
            min-width: 20px;
            border-radius: 5px;
        }}

        QScrollBar::handle:horizontal:hover {{
            background: #94a3b8;
        }}

        QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal,
        QScrollBar::add-page:horizontal, QScrollBar::sub-page:horizontal {{
            background: none;
            width: 0px;
        }}

        /* Tooltips */
        QToolTip {{
            background-color: #0f172a;
            color: #ffffff;
            border: 1px solid #334155;
            padding: 5px 8px;
            border-radius: 4px;
        }}

        /* ================= CALENDAR WIDGET (LIGHT) ================= */
        QCalendarWidget {{
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }}

        QCalendarWidget QWidget#qt_calendar_navigationbar {{
            background-color: #0284c7;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            min-height: 38px;
            padding: 2px 6px;
        }}

        QCalendarWidget QToolButton {{
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            background-color: transparent;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            margin: 2px;
        }}

        QCalendarWidget QToolButton:hover {{
            background-color: rgba(255, 255, 255, 0.25);
        }}

        QCalendarWidget QToolButton:pressed {{
            background-color: rgba(255, 255, 255, 0.35);
        }}

        QCalendarWidget QToolButton::menu-indicator {{
            image: none;
            width: 0px;
        }}

        QCalendarWidget #qt_calendar_prevmonth {{
            qproperty-icon: none;
            image: url({chevron_left});
            width: 14px;
            height: 14px;
        }}

        QCalendarWidget #qt_calendar_nextmonth {{
            qproperty-icon: none;
            image: url({chevron_right});
            width: 14px;
            height: 14px;
        }}

        QCalendarWidget QSpinBox {{
            background-color: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            padding: 2px 6px;
            margin: 2px;
            selection-background-color: transparent;
            selection-color: #ffffff;
        }}

        QCalendarWidget QSpinBox::up-button, QCalendarWidget QSpinBox::down-button {{
            width: 0px;
            height: 0px;
            border: none;
        }}

        QCalendarWidget QMenu {{
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 4px;
            color: #0f172a;
        }}

        QCalendarWidget QMenu::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
        }}

        QCalendarWidget QTableView {{
            background-color: #ffffff;
            alternate-background-color: #ffffff;
            selection-background-color: #0284c7;
            selection-color: #ffffff;
            border: none;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            outline: 0px;
            color: #0f172a;
        }}

        QCalendarWidget QTableView::item {{
            border-radius: 4px;
            padding: 4px;
        }}

        QCalendarWidget QTableView::item:hover {{
            background-color: #e0f2fe;
            color: #0369a1;
        }}

        QCalendarWidget QTableView::item:selected {{
            background-color: #0284c7;
            color: #ffffff;
            font-weight: bold;
        }}

        QCalendarWidget QHeaderView::section {{
            background-color: #f8fafc;
            color: #64748b;
            font-weight: bold;
            font-size: 11px;
            border: none;
            border-bottom: 1px solid #e2e8f0;
            padding: 5px 0px;
        }}
        """

def apply_theme(app: QApplication, mode: str = None):
    """Applies palette and global stylesheet to QApplication."""
    global _calendar_filter_installed
    if not _calendar_filter_installed and app:
        app_filter = CalendarConfigFilter(app)
        app.installEventFilter(app_filter)
        _calendar_filter_installed = True

    if mode is None:
        mode = get_theme_mode()
    effective = get_effective_theme(mode)
    
    app.setStyle("Fusion")
    app.setPalette(get_palette(effective))
    app.setStyleSheet(get_qss(effective))
    
    # Store effective theme on application object for easy querying
    app.setProperty("effective_theme", effective)
    app.setProperty("theme_mode", mode)
    logger.info(f"Theme applied: mode={mode}, effective={effective}")
    return effective
