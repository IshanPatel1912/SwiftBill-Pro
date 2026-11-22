// SwiftBill Pro - Realistic Retail Dataset matching physical store catalog

export const initialBusinessDetails = {
  name: "Metro Supermarket & Daily Needs",
  tagline: "Quality Groceries & Fast Checkout",
  address: "Shop No. 12-14, Ground Floor, Central Mall, M.G. Road",
  city: "Ahmedabad, Gujarat 380009",
  phone: "+91 98765 43210",
  owner: "Ishan Patel",
  email: "contact@metrosupermarket.com",
  gstin: "24AAAPL1234C1ZV",
  currency: "₹",
  thermalRollSize: "80mm",
  headerGreeting: "*** WELCOME TO METRO SUPERMARKET ***",
  footerNote: "Goods once sold can be exchanged within 7 days with invoice. Thank you for shopping with us! Have a nice day.",
  whatsappStatus: "Connected (916351803513)",
  whatsappAutoSend: true,
};

export const initialItems = [
  { id: 1, code: "1", name: "Amul Butter 500g", category: "Dairy", unit: "pack", mrp: 285.00, purchaseRate: 250.00, taxRate: 5, barcode: "8901262010112" },
  { id: 2, code: "2", name: "Fortune Sunflower Oil 1L", category: "Grocery", unit: "ltr", mrp: 165.00, purchaseRate: 140.00, taxRate: 5, barcode: "8906007281023" },
  { id: 3, code: "3", name: "Aashirvaad Shudh Chakki Atta 5kg", category: "Grocery", unit: "pack", mrp: 260.00, purchaseRate: 225.00, taxRate: 0, barcode: "8901030043120" },
  { id: 4, code: "4", name: "Tata Salt 1kg", category: "Grocery", unit: "pack", mrp: 28.00, purchaseRate: 23.00, taxRate: 0, barcode: "8904004400018" },
  { id: 5, code: "5", name: "Maggi 2-Minute Noodles 280g (Pack of 4)", category: "Snacks", unit: "pack", mrp: 56.00, purchaseRate: 48.00, taxRate: 12, barcode: "8901058852312" },
  { id: 6, code: "6", name: "Parle-G Gold Biscuits 1kg", category: "Snacks", unit: "pack", mrp: 90.00, purchaseRate: 75.00, taxRate: 18, barcode: "8901719101111" },
  { id: 7, code: "7", name: "Britannia Good Day Butter 250g", category: "Snacks", unit: "pack", mrp: 45.00, purchaseRate: 36.00, taxRate: 18, barcode: "8901063012015" },
  { id: 8, code: "8", name: "Dettol Original Soap 125g (Buy 3 Get 1)", category: "Personal Care", unit: "pack", mrp: 180.00, purchaseRate: 152.00, taxRate: 18, barcode: "8901396123456" },
  { id: 9, code: "9", name: "Colgate Strong Teeth Toothpaste 300g", category: "Personal Care", unit: "pcs", mrp: 140.00, purchaseRate: 118.00, taxRate: 18, barcode: "8901314010202" },
  { id: 10, code: "10", name: "Surf Excel Quick Wash Detergent Powder 1kg", category: "Household", unit: "kg", mrp: 195.00, purchaseRate: 168.00, taxRate: 18, barcode: "8901030612349" },
  { id: 11, code: "11", name: "Tata Tea Gold 500g", category: "Beverages", unit: "pack", mrp: 340.00, purchaseRate: 290.00, taxRate: 5, barcode: "8901052001013" },
  { id: 12, code: "12", name: "Nescafe Classic Coffee Jar 100g", category: "Beverages", unit: "jar", mrp: 245.00, purchaseRate: 205.00, taxRate: 18, barcode: "8901058861002" },
  { id: 13, code: "13", name: "Coca-Cola 750ml PET", category: "Beverages", unit: "bottle", mrp: 40.00, purchaseRate: 32.00, taxRate: 28, barcode: "8901764012111" },
  { id: 14, code: "14", name: "Lay's India's Magic Masala 50g", category: "Snacks", unit: "pack", mrp: 20.00, purchaseRate: 16.50, taxRate: 12, barcode: "8901491102030" },
  { id: 15, code: "15", name: "Cadbury Dairy Milk Silk 150g", category: "Snacks", unit: "pcs", mrp: 175.00, purchaseRate: 145.00, taxRate: 18, barcode: "7622201123456" },
  { id: 16, code: "16", name: "Daawat Rozana Super Basmati Rice 5kg", category: "Grocery", unit: "bag", mrp: 480.00, purchaseRate: 410.00, taxRate: 0, barcode: "8901537002011" },
  { id: 17, code: "17", name: "Tata Sampann Unpolished Toor Dal 1kg", category: "Grocery", unit: "pack", mrp: 185.00, purchaseRate: 155.00, taxRate: 0, barcode: "8904004403322" },
  { id: 18, code: "18", name: "Haldiram's Nagpur Bhujia Sev 400g", category: "Snacks", unit: "pack", mrp: 120.00, purchaseRate: 98.00, taxRate: 12, barcode: "8904063201019" },
  { id: 19, code: "19", name: "Vim Dishwash Bar 300g (Pack of 3)", category: "Household", unit: "pack", mrp: 55.00, purchaseRate: 44.00, taxRate: 18, barcode: "8901030012019" },
  { id: 20, code: "20", name: "Lizol Disinfectant Floor Cleaner 1L Citrus", category: "Household", unit: "bottle", mrp: 215.00, purchaseRate: 178.00, taxRate: 18, barcode: "8901396345612" },
];

export const initialInventory = [
  { itemCode: "1", name: "Amul Butter 500g", stock: 35, purchaseRate: 250.00, sellingPrice: 285.00, reorderLevel: 10, unit: "pack" },
  { itemCode: "2", name: "Fortune Sunflower Oil 1L", stock: 45, purchaseRate: 140.00, sellingPrice: 165.00, reorderLevel: 15, unit: "ltr" },
  { itemCode: "3", name: "Aashirvaad Shudh Chakki Atta 5kg", stock: 28, purchaseRate: 225.00, sellingPrice: 260.00, reorderLevel: 8, unit: "pack" },
  { itemCode: "4", name: "Tata Salt 1kg", stock: 80, purchaseRate: 23.00, sellingPrice: 28.00, reorderLevel: 25, unit: "pack" },
  { itemCode: "5", name: "Maggi 2-Minute Noodles 280g", stock: 65, purchaseRate: 48.00, sellingPrice: 56.00, reorderLevel: 20, unit: "pack" },
  { itemCode: "6", name: "Parle-G Gold Biscuits 1kg", stock: 50, purchaseRate: 75.00, sellingPrice: 90.00, reorderLevel: 15, unit: "pack" },
  { itemCode: "7", name: "Britannia Good Day Butter 250g", stock: 40, purchaseRate: 36.00, sellingPrice: 45.00, reorderLevel: 12, unit: "pack" },
  { itemCode: "8", name: "Dettol Original Soap 125g", stock: 6, purchaseRate: 152.00, sellingPrice: 180.00, reorderLevel: 10, unit: "pack" }, // Low stock!
  { itemCode: "9", name: "Colgate Strong Teeth Toothpaste", stock: 22, purchaseRate: 118.00, sellingPrice: 140.00, reorderLevel: 8, unit: "pcs" },
  { itemCode: "10", name: "Surf Excel Quick Wash 1kg", stock: 30, purchaseRate: 168.00, sellingPrice: 195.00, reorderLevel: 10, unit: "kg" },
  { itemCode: "11", name: "Tata Tea Gold 500g", stock: 18, purchaseRate: 290.00, sellingPrice: 340.00, reorderLevel: 5, unit: "pack" },
  { itemCode: "12", name: "Nescafe Classic Coffee 100g", stock: 14, purchaseRate: 205.00, sellingPrice: 245.00, reorderLevel: 6, unit: "jar" },
  { itemCode: "13", name: "Coca-Cola 750ml PET", stock: 4, purchaseRate: 32.00, sellingPrice: 40.00, reorderLevel: 10, unit: "bottle" }, // Low stock!
  { itemCode: "14", name: "Lay's India's Magic Masala 50g", stock: 75, purchaseRate: 16.50, sellingPrice: 20.00, reorderLevel: 25, unit: "pack" },
  { itemCode: "15", name: "Cadbury Dairy Milk Silk 150g", stock: 24, purchaseRate: 145.00, sellingPrice: 175.00, reorderLevel: 8, unit: "pcs" },
  { itemCode: "16", name: "Daawat Rozana Basmati Rice 5kg", stock: 16, purchaseRate: 410.00, sellingPrice: 480.00, reorderLevel: 5, unit: "bag" },
  { itemCode: "17", name: "Tata Sampann Toor Dal 1kg", stock: 25, purchaseRate: 155.00, sellingPrice: 185.00, reorderLevel: 8, unit: "pack" },
  { itemCode: "18", name: "Haldiram's Bhujia Sev 400g", stock: 32, purchaseRate: 98.00, sellingPrice: 120.00, reorderLevel: 10, unit: "pack" },
  { itemCode: "19", name: "Vim Dishwash Bar 300g", stock: 45, purchaseRate: 44.00, sellingPrice: 55.00, reorderLevel: 15, unit: "pack" },
  { itemCode: "20", name: "Lizol Floor Cleaner 1L", stock: 20, purchaseRate: 178.00, sellingPrice: 215.00, reorderLevel: 6, unit: "bottle" },
];

export const initialCustomers = [
  { id: 1, name: "Rajesh Sharma", phone: "9825012345", address: "A-201, Shivalik Residency", totalBills: 8, totalSpend: 5420.00, lastVisit: "2026-11-21" },
  { id: 2, name: "Priya Patel", phone: "9898011223", address: "B-404, Green Acres, Bodakdev", totalBills: 12, totalSpend: 11840.00, lastVisit: "2026-11-22" },
  { id: 3, name: "Amit Verma", phone: "9724033445", address: "15, Royal Bungalows, Satellite", totalBills: 5, totalSpend: 3120.00, lastVisit: "2026-11-20" },
  { id: 4, name: "Neha Shah", phone: "9426055667", address: "C-12, Sun Divine Apartments", totalBills: 3, totalSpend: 1890.00, lastVisit: "2026-11-18" },
  { id: 5, name: "Vikram Singh", phone: "9909077889", address: "7, Krishna Heights, Vastrapur", totalBills: 15, totalSpend: 16400.00, lastVisit: "2026-11-22" },
  { id: 6, name: "Sneha Desai", phone: "9879099001", address: "42, Shreenath Park, Paldi", totalBills: 2, totalSpend: 950.00, lastVisit: "2026-11-15" },
  { id: 7, name: "Karan Mehta", phone: "9824022334", address: "B-10, Orchid Heights, Prahlad Nagar", totalBills: 9, totalSpend: 8200.00, lastVisit: "2026-11-21" },
  { id: 8, name: "Anjali Joshi", phone: "9978044556", address: "D-302, Applewoods, Shela", totalBills: 4, totalSpend: 2650.00, lastVisit: "2026-11-19" },
];

export const initialInvoices = [
  {
    id: 1001,
    invoiceNo: "INV-1001",
    date: "2026-11-22",
    time: "10:15 AM",
    customerName: "Priya Patel",
    customerMobile: "9898011223",
    items: [
      { code: "1", name: "Amul Butter 500g", qty: 1, rate: 285.00, total: 285.00 },
      { code: "2", name: "Fortune Sunflower Oil 1L", qty: 2, rate: 165.00, total: 330.00 },
      { code: "6", name: "Parle-G Gold Biscuits 1kg", qty: 1, rate: 90.00, total: 90.00 },
    ],
    subtotal: 705.00,
    discount: 0.00,
    tax: 35.25,
    grandTotal: 740.25,
    paidAmount: 740.25,
    paymentMode: "UPI (Google Pay)",
    status: "PAID",
    cashier: "admin"
  },
  {
    id: 1002,
    invoiceNo: "INV-1002",
    date: "2026-11-22",
    time: "11:05 AM",
    customerName: "Vikram Singh",
    customerMobile: "9909077889",
    items: [
      { code: "3", name: "Aashirvaad Shudh Chakki Atta 5kg", qty: 1, rate: 260.00, total: 260.00 },
      { code: "16", name: "Daawat Rozana Basmati Rice 5kg", qty: 1, rate: 480.00, total: 480.00 },
      { code: "17", name: "Tata Sampann Toor Dal 1kg", qty: 2, rate: 185.00, total: 370.00 },
      { code: "4", name: "Tata Salt 1kg", qty: 1, rate: 28.00, total: 28.00 },
    ],
    subtotal: 1138.00,
    discount: 38.00,
    tax: 0.00,
    grandTotal: 1100.00,
    paidAmount: 1100.00,
    paymentMode: "Cash",
    status: "PAID",
    cashier: "cashier1"
  },
  {
    id: 1003,
    invoiceNo: "INV-1003",
    date: "2026-11-21",
    time: "04:30 PM",
    customerName: "Rajesh Sharma",
    customerMobile: "9825012345",
    items: [
      { code: "11", name: "Tata Tea Gold 500g", qty: 1, rate: 340.00, total: 340.00 },
      { code: "12", name: "Nescafe Classic Coffee 100g", qty: 1, rate: 245.00, total: 245.00 },
      { code: "15", name: "Cadbury Dairy Milk Silk 150g", qty: 2, rate: 175.00, total: 350.00 },
    ],
    subtotal: 935.00,
    discount: 35.00,
    tax: 62.00,
    grandTotal: 962.00,
    paidAmount: 962.00,
    paymentMode: "Card",
    status: "PAID",
    cashier: "admin"
  },
  {
    id: 1004,
    invoiceNo: "INV-1004",
    date: "2026-11-21",
    time: "07:45 PM",
    customerName: "Karan Mehta",
    customerMobile: "9824022334",
    items: [
      { code: "10", name: "Surf Excel Quick Wash 1kg", qty: 1, rate: 195.00, total: 195.00 },
      { code: "8", name: "Dettol Original Soap 125g", qty: 1, rate: 180.00, total: 180.00 },
      { code: "20", name: "Lizol Floor Cleaner 1L", qty: 1, rate: 215.00, total: 215.00 },
      { code: "19", name: "Vim Dishwash Bar 300g", qty: 2, rate: 55.00, total: 110.00 },
    ],
    subtotal: 700.00,
    discount: 0.00,
    tax: 84.00,
    grandTotal: 784.00,
    paidAmount: 784.00,
    paymentMode: "UPI (PhonePe)",
    status: "PAID",
    cashier: "cashier1"
  },
  {
    id: 1005,
    invoiceNo: "INV-1005",
    date: "2026-11-20",
    time: "02:20 PM",
    customerName: "Amit Verma",
    customerMobile: "9724033445",
    items: [
      { code: "13", name: "Coca-Cola 750ml PET", qty: 2, rate: 40.00, total: 80.00 },
      { code: "14", name: "Lay's India's Magic Masala 50g", qty: 3, rate: 20.00, total: 60.00 },
      { code: "5", name: "Maggi 2-Minute Noodles 280g", qty: 2, rate: 56.00, total: 112.00 },
    ],
    subtotal: 252.00,
    discount: 2.00,
    tax: 24.00,
    grandTotal: 274.00,
    paidAmount: 274.00,
    paymentMode: "Cash",
    status: "PAID",
    cashier: "admin"
  }
];

export const initialPurchases = [
  { id: 1, invoiceNo: "PUR-8821", date: "2026-11-19", supplier: "Gujarat FMCG Distributors", totalAmount: 38450.00, itemsCount: 12, status: "Received", paymentStatus: "Paid" },
  { id: 2, invoiceNo: "PUR-8822", date: "2026-11-21", supplier: "Amul Dairy Supply Co.", totalAmount: 18200.00, itemsCount: 4, status: "Received", paymentStatus: "Paid" },
  { id: 3, invoiceNo: "PUR-8823", date: "2026-11-22", supplier: "Nestle & Beverages Wholesale", totalAmount: 12600.00, itemsCount: 6, status: "Pending Delivery", paymentStatus: "Credit" }
];

export const initialExpenditures = [
  { id: 1, date: "2026-11-22", name: "Store Electricity Bill (Torrent Power)", category: "Utilities", amount: 4850.00, mode: "Net Banking", notes: "Billing for October cycle" },
  { id: 2, date: "2026-11-21", name: "Thermal Printer Rolls (Pack of 50)", category: "Supplies", amount: 1200.00, mode: "Cash", notes: "80mm standard POS paper" },
  { id: 3, date: "2026-11-20", name: "Commercial High-Speed Internet (Airtel)", category: "Utilities", amount: 1180.00, mode: "UPI", notes: "Static IP Fiber" },
  { id: 4, date: "2026-11-19", name: "Daily Store Floor Sanitization & Cleaning", category: "Maintenance", amount: 450.00, mode: "Cash", notes: "Cleaning chemicals & labor" },
  { id: 5, date: "2026-11-18", name: "Counter Staff Tea & Refreshments", category: "Welfare", amount: 280.00, mode: "Cash", notes: "Weekly snacks" },
  { id: 6, date: "2026-11-15", name: "Air Conditioner Servicing & Filter Cleaning", category: "Maintenance", amount: 1500.00, mode: "Cash", notes: "2x 2-Ton Cassette ACs" },
];

export const initialUsers = [
  { id: 1, username: "admin", name: "Ishan Patel", role: "Administrator", active: true, lastLogin: "Today at 09:15 AM" },
  { id: 2, username: "cashier1", name: "Ramesh Kumar", role: "Cashier", active: true, lastLogin: "Today at 10:00 AM" },
  { id: 3, username: "manager", name: "Suresh Sharma", role: "Store Manager", active: true, lastLogin: "Yesterday at 06:30 PM" },
];
