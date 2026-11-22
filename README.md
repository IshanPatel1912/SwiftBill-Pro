<div align="center">

# 🏪 Convenience Store & Supermarket POS Billing System

**A modern, feature-rich Point-of-Sale (POS) and inventory management desktop software for retail marts, convenience stores, and supermarkets. Built with PyQt6, SQLite (SQLAlchemy), ReportLab, and ESC/POS thermal printing.**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![PyQt6](https://img.shields.io/badge/GUI-PyQt6-41CD52?logo=qt&logoColor=white)
![SQLite](https://img.shields.io/badge/DB-SQLite%20%2B%20SQLAlchemy-003B57?logo=sqlite&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp%20Bridge-Node.js%20%2B%20Baileys-339933?logo=node.js&logoColor=white)
![Thermal](https://img.shields.io/badge/Printing-ESC%2FPOS%20Thermal%20%2B%20A4%20PDF-blueviolet)

</div>

---

## ✨ Highlights & Architecture

- 🎨 **Adaptive Light & Dark Themes**: Automatically detects your Windows system theme (`AppsUseLightTheme`) on launch, with a 1-click header switcher between `System Default (Auto)`, `Light Mode`, and `Dark Mode`.
- ⚡ **High-Speed Counter POS**: Instant SKU/code lookups (codes `1`–`100`), auto-fill product catalog, live subtotal & discount calculation, and cash-change balance indicators.
- 🖨️ **Dual Printing System**:
  - **Direct Thermal Receipt Printing** (58mm and 80mm ESC/POS roll printers) directly over USB without external print dialogs.
  - **Full-Page A4 Invoices** with business branding, customer details, and itemized layout via ReportLab.
- 💬 **Integrated WhatsApp Service**: Standalone background Node.js microservice (`whatsapp_bridge`) powered by Baileys. One-time QR pairing saves session credentials locally; bills are delivered instantly in the background without browser automation.
- 📦 **Real-Time Inventory Management**: Live inventory tracking that automatically decrements stock on sales, warns on low stock, and supports bulk opening stock entry with PDF exports.
- 📈 **Product Profit Analytics**: Per-item sales volume, average selling price, average cost price, unit margins, total profit, and interactive visual breakdown.
- 📊 **Financial Portfolio & Reports**: Period filtering (`Today`, `This Month`, `This Year`, `All Time`) with 5 dedicated export formats:
  - Sell Report (PDF)
  - Purchase Report (PDF)
  - Expenditure Report (PDF)
  - All-Over Statement (PDF)
  - All-Over Financial Data (CSV)
- 🔒 **User Management & Security**: Multi-user login control with bcrypt password hashing and user administration inside Settings.
- 🧪 **Pre-Seeded Test Data**: Ships with 20 realistic store items, live inventory stock, sales invoices, purchase logs, daily expenses, and customer records ready for immediate out-of-the-box testing.

---

## 🖥️ Tabs Walkthrough

| Tab | Key Capabilities |
|---|---|
| 💰 **POS / Sell** | Counter billing interface, product autocomplete, customer phone, discount % and amount, paid status, thermal receipt printing, A4 invoice printing, and WhatsApp share. |
| 🏷️ **Items** | Master item dictionary (Item Code, Name, MRP, Unit Type) with Excel sample download & bulk Excel import. |
| 🛒 **Purchase** | Stock intake records (Date, Code, Name, Qty, Cost, MRP, In-Stock indicator), date range filters, and bulk Excel purchase import. |
| 💸 **Expenditure** | Daily store operating expenses (Description, Amount, Date) with date filtering and expense management. |
| 🔍 **Find Bill** | Search past invoices by Bill ID, Customer, or Date; reprint thermal receipts; reprint A4 invoices; export to PDF; and recycle bin management. |
| 📦 **Inventory** | Stock catalog with real-time quantities, cost vs. MRP margins, stock valuation, and PDF stock export. |
| 📈 **Analytics** | SKU-level profitability, sold quantities, unit margins, and sales contribution chart. |
| 📊 **Portfolio** | High-level P&L dashboard (Sales, Purchases, Expenses, Net Profit) across period filters with 5 export formats. |
| 🏠 **Dashboard** | Daily KPI summary, today's sales counter, and active session revenue overview. |
| 👥 **Customers** | Customer directory with purchase histories, contact records, and last-visit dates. |
| ⚙️ **Settings** | Business details (Store name, address, phone, owner), printer selection (58mm / 80mm), WhatsApp device pairing, and user access management. |

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `F1` | Jump to **POS / Sell** tab immediately |
| `F5` | Refresh data / Reset current tab form |
| `Ctrl + S` | Save current bill / Save business settings / Save PDF |
| `Ctrl + P` | Direct print A4 invoice |
| `Delete` | Delete selected item / row in active tab |
| `Enter` / `Return` | Quick add item / Search / Filter |

---

## 🚀 Getting Started

### Prerequisites
1. **Windows 10 / 11 (64-bit)**
2. **Python 3.11+**
3. **Node.js 18+** (for WhatsApp Bridge service)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/IshanPatel1912/Convenience_Billing_System.git
cd Convenience_Billing_System

# 2. Set up Python virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 3. Set up WhatsApp Bridge (optional, for WhatsApp bill delivery)
cd whatsapp_bridge
npm install
cd ..

# 4. Launch the application
python main.py
```

### Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier1` / `cashier123`
- **Manager**: `manager` / `manager123`

---

## 📦 Building Standalone Windows Executable & Installer

To compile into a standalone `.exe` and single-file setup installer:

```bash
# Activate virtual environment
venv\Scripts\activate

# Run automated builder (PyInstaller + Inno Setup)
python build_exe.py
```

The compiled standalone application will be generated in `dist/BillingSystem/BillingSystem.exe`, and the single-file installer in `dist_installer/BillingSystem_Setup.exe`.

---

## 📁 Project Structure

```
Convenience_Billing_System/
├── main.py                     # Application entry point & login dialog
├── database.py                 # SQLAlchemy ORM models & database setup
├── config.ini                  # Configuration (theme, printer, currency)
├── requirements.txt            # Python dependencies
├── BillingSystem.spec          # PyInstaller standalone build configuration
├── installer.iss               # Inno Setup Windows installer script
├── build_exe.py                # Automated PyInstaller compilation script
├── run.bat                     # Quick launcher batch file
├── start_whatsapp.bat          # WhatsApp service background runner
├── app_icon.ico                # Application branding icon
├── arial*.ttf                  # Embedded TrueType fonts for PDF generation
├── assets/                     # Crisp vector UI icons (checkmarks, chevrons)
├── modules/
│   ├── logging_config.py       # Rotating log configuration
│   ├── pdf_generator.py        # ReportLab PDF invoice & thermal generator
│   ├── theme_manager.py        # Light/Dark theme & system theme detection
│   └── whatsapp_service.py     # Python client bridge for WhatsApp microservice
├── tabs/
│   ├── sell_tab.py             # POS counter billing & thermal print integration
│   ├── item_tab.py             # Master items catalog & Excel import
│   ├── purchase_tab.py         # Purchase and stock intake tab
│   ├── expenditure_tab.py      # Expense management tab
│   ├── find_bill_tab.py        # Bill history, reprint, and PDF export
│   ├── inventory_tab.py        # Inventory & stock management
│   ├── analytics_tab.py        # Product profit & margin analytics
│   ├── portfolio_tab.py        # Financial P&L summary and 5 report exports
│   ├── dashboard_tab.py        # Overview KPI dashboard
│   ├── customer_tab.py         # Customer records and history
│   └── business_detail_tab.py  # Business profile & user management settings
└── whatsapp_bridge/
    ├── package.json            # Node.js dependencies (Baileys)
    └── server.js               # Microservice handling QR pairing & messaging
```

---

## 👤 Author

**Ishan Patel**  
Undergraduate Student, Pandit Deendayal Energy University (PDEU)  
GitHub: [@IshanPatel1912](https://github.com/IshanPatel1912)
