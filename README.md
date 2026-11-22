# SwiftBill Pro 🚀
### Modern Retail Point-of-Sale (POS), Inventory & Store Billing Suite

![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)
![Editions](https://img.shields.io/badge/editions-Desktop_Qt_%7C_Modern_React-emerald.svg)
![Hardware](https://img.shields.io/badge/hardware-ESC%2FPOS_80mm_%7C_Barcode-orange.svg)
![Microservice](https://img.shields.io/badge/whatsapp-Automated_PDF_Bridge-success.svg)

**SwiftBill Pro** is a commercial-grade retail management and point-of-sale solution engineered for supermarkets, grocery stores, department outlets, and retail counters. Built with physical store operations and cashiers in mind, it provides instant barcode lookups, automated ESC/POS thermal printing, and digital WhatsApp receipt dispatch.

---

## 📁 Repository Structure

The project is cleanly divided into two dedicated editions:

```text
SwiftBill-Pro/
├── 📁 desktop-python/          # Standalone Windows Desktop Edition (PyQt6)
│   ├── main.py                 # Core application entry point
│   ├── database.py             # SQLite ORM & schema definitions
│   ├── tabs/                   # 10 Dedicated Retail Management Tabs
│   ├── modules/                # Thermal printing, theme manager, PDF engine
│   ├── whatsapp_bridge/        # Node.js Baileys / WhatsApp web microservice
│   ├── build_exe.py            # Automated PyInstaller & Inno Setup compiler
│   └── run.bat                 # One-click desktop app launcher
│
├── 📁 react-app/               # Modern Store UI Edition (React 18 + Vite + Tailwind)
│   ├── src/views/              # All 10 store tabs fully implemented in React
│   ├── src/components/         # Sidebar, Topbar, 80mm Photorealistic Receipt Modal
│   ├── src/context/            # Interactive localStorage state store & demo dataset
│   ├── run.bat                 # One-click React dev server & browser launcher
│   └── package.json            # Vite, Tailwind CSS, Lucide icons, canvas-confetti
│
├── run_desktop.bat             # Root shortcut to launch Python Desktop Edition
├── run_react.bat               # Root shortcut to launch Modern React Edition
└── README.md                   # Documentation & overview
```

---

## ⚡ Quick Start

### Option 1: Modern React UI Edition
To experience the high-performance modern web interface:
1. Double-click `run_react.bat` (or inside `react-app/`, run `run.bat`).
2. Alternatively via terminal:
   ```bash
   cd react-app
   npm install
   npm run dev
   ```
3. Opens automatically at `http://localhost:5173`.
4. Comes pre-loaded with realistic supermarket catalog items, stock records, customers, and invoices!

### Option 2: Desktop Python Edition (Production POS)
To launch the native Windows desktop terminal with direct hardware ESC/POS spooling:
1. Double-click `run_desktop.bat` (or inside `desktop-python/`, run `run.bat`).
2. Alternatively via terminal:
   ```bash
   cd desktop-python
   venv\Scripts\python.exe main.py
   ```

---

## 🌟 Feature Breakdown Across Both Editions

| Module / Tab | Capabilities |
|---|---|
| **🛒 POS / Sell Terminal** | Rapid item code / barcode entry, quantity spinner, live subtotal & composite GST calculation, custom checkmark for "Mark as Paid", cash/UPI/card toggles, and `<F1>` instant thermal print. |
| **📦 Items Master Catalog** | 20+ pre-seeded grocery/dairy products, category filter chips, search by barcode, cost price vs MRP margin %, and Add/Edit modals. |
| **🏭 Inventory & Valuation** | Live on-hand stock counts, total stock valuation (cost) vs retail value (MRP), low-stock warning threshold alerts (< 10 units), and quick stock adjustment. |
| **🚚 Purchases** | Inward stock intake from wholesale FMCG distributors, invoice number tracking, and delivery/payment logs. |
| **🧾 Expenditures** | Log daily utility bills, thermal paper roll purchases, sanitization, and store maintenance costs. |
| **🔍 Find Bill / Invoices** | Search historical bills by invoice number, customer phone, or date. Reprint 80mm receipts, preview A4 tax invoices, and dispatch WhatsApp PDFs. |
| **📊 Analytics & Charts** | 7-day revenue trend chart, payment mode share (UPI vs Cash vs Card), and Top 5 fast-moving items leaderboard. |
| **📈 Portfolio & Reports** | Consolidated profit & loss statement, gross margin %, and **5 one-click accountant export reports** (Sales, Purchases, GSTR-1 Tax, Inventory Valuation, and Daily Cash Settlement). |
| **👥 Customers & Loyalty** | Customer directory, lifetime spend tracking, total store visits, and instant "Bill Now" shortcut. |
| **⚙️ Store Settings** | Business name, address, contact, GSTIN, receipt header greeting & footer return policy, WhatsApp QR code pairing status, user management, and Light/Dark themes. |

---

## 🖨️ Hardware & Printing Support
- **Thermal Receipt Printing**: Optimized for standard **80mm** (and compact **58mm**) thermal rolls with high-contrast monospaced layout, dashed separators, payment QR code, and barcode.
- **WhatsApp Integration**: Integrated microservice automatically generates lightweight invoice PDFs and dispatches them directly to the customer's phone number without recurring API costs.
- **Standalone Installer**: Includes Inno Setup configuration (`installer.iss`) to produce a single-file `BillingSystem_Setup.exe` with bundled portable Node.js and Poppler PDF libraries.

---

## 🔒 Security & Offline Guarantee
- Operates **100% offline** without requiring cloud database connectivity.
- Cashier terminals operate with millisecond barcode response times.
- State in the React edition persists via browser `localStorage` with a 1-click **Reset Demo Data** button for customer demonstrations.

---

## 📜 License
Proprietary Commercial Retail Software. Built for client deployment.
