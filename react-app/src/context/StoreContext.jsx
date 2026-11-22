import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  // Helper to load persisted state or fallback
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`swiftbill_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // 1. Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('swiftbill_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Navigation State
  const [activeTab, setActiveTab] = useState('pos'); // pos, item, purchase, expense, find_bill, inventory, analytics, portfolio, dashboard, customer, settings
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('swiftbill_sidebar_collapsed') === 'true';
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('swiftbill_theme') || 'system');

  // 3. Clean Initial State (No fake demo records)
  const defaultBusiness = {
    name: "Convenience Store",
    address: "123 Business Street, City Center",
    phone: "+91 9876543210",
    owner: "Store Owner",
    printer: "Default Windows Printer",
    thermalRollSize: "80mm (Standard POS)",
    themeMode: "system",
    whatsappEnabled: true,
    whatsappStatus: "Connected",
  };

  const defaultUsers = [
    { id: 1, username: "admin", password: "admin" }
  ];

  const [businessDetails, setBusinessDetails] = useState(() => loadState('business', defaultBusiness));
  const [users, setUsers] = useState(() => loadState('users', defaultUsers));

  // Store data tables - starting clean
  const [items, setItems] = useState(() => loadState('items', []));
  const [inventory, setInventory] = useState(() => loadState('inventory', []));
  const [purchases, setPurchases] = useState(() => loadState('purchases', []));
  const [expenditures, setExpenditures] = useState(() => loadState('expenditures', []));
  const [customers, setCustomers] = useState(() => loadState('customers', []));
  const [sales, setSales] = useState(() => loadState('sales', []));
  const [heldBills, setHeldBills] = useState(() => loadState('held_bills', []));

  // Modals & UI Feedback
  const [receiptModalSale, setReceiptModalSale] = useState(null);
  const [a4ModalSale, setA4ModalSale] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('swiftbill_business', JSON.stringify(businessDetails));
  }, [businessDetails]);

  useEffect(() => {
    localStorage.setItem('swiftbill_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('swiftbill_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('swiftbill_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('swiftbill_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('swiftbill_expenditures', JSON.stringify(expenditures));
  }, [expenditures]);

  useEffect(() => {
    localStorage.setItem('swiftbill_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('swiftbill_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('swiftbill_held_bills', JSON.stringify(heldBills));
  }, [heldBills]);

  useEffect(() => {
    localStorage.setItem('swiftbill_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
  }, [isSidebarCollapsed]);

  // Theme Management
  useEffect(() => {
    localStorage.setItem('swiftbill_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth Methods
  const login = (username, password) => {
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('swiftbill_auth_user', JSON.stringify(found));
      showToast(`Welcome back, ${found.username}!`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('swiftbill_auth_user');
    showToast('Logged out successfully', 'info');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Item Management (ItemTab)
  const saveItem = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return [...prev, { ...item, id: Date.now() }];
    });
    showToast('Item saved to catalog!');
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item deleted', 'info');
  };

  // Purchase Management (PurchaseTab)
  const addPurchase = (purchaseData, addToInventory = true) => {
    const newPur = {
      ...purchaseData,
      id: Date.now(),
      dateTime: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('en-GB'), // DD-MM-YYYY
    };
    setPurchases((prev) => [newPur, ...prev]);

    if (addToInventory) {
      setInventory((prev) => {
        const existing = prev.find(
          (inv) => inv.itemCode === newPur.itemCode || inv.itemName.toLowerCase() === newPur.itemName.toLowerCase()
        );
        if (existing) {
          return prev.map((inv) =>
            inv.id === existing.id
              ? {
                  ...inv,
                  availableQty: inv.availableQty + newPur.quantity,
                  costPrice: newPur.costPrice,
                  mrp: newPur.mrp,
                  stockValue: (inv.availableQty + newPur.quantity) * newPur.costPrice,
                }
              : inv
          );
        } else {
          return [
            ...prev,
            {
              id: Date.now(),
              itemCode: newPur.itemCode,
              itemName: newPur.itemName,
              availableQty: newPur.quantity,
              costPrice: newPur.costPrice,
              mrp: newPur.mrp,
              stockValue: newPur.quantity * newPur.costPrice,
            },
          ];
        }
      });
    }
    showToast('Stock intake recorded successfully!');
  };

  const deletePurchase = (id) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    showToast('Purchase entry deleted', 'info');
  };

  // Expenditure Management (ExpenditureTab)
  const saveExpenditure = (exp) => {
    if (exp.id) {
      setExpenditures((prev) => prev.map((e) => (e.id === exp.id ? exp : e)));
      showToast('Expense updated!');
    } else {
      const newExp = {
        id: Date.now(),
        description: exp.description,
        amount: parseFloat(exp.amount),
        date: exp.date || new Date().toLocaleDateString('en-GB'),
        dateTime: new Date().toISOString(),
      };
      setExpenditures((prev) => [newExp, ...prev]);
      showToast('Expense added successfully!');
    }
  };

  const deleteExpenditure = (id) => {
    setExpenditures((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense deleted', 'info');
  };

  // Customer Management (CustomerTab)
  const saveCustomer = (cust) => {
    if (cust.id) {
      setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
      showToast('Customer profile updated!');
    } else {
      const newCust = {
        id: Date.now(),
        name: cust.name,
        mobile: cust.mobile,
        lastVisit: new Date().toLocaleDateString('en-GB'),
      };
      setCustomers((prev) => [...prev, newCust]);
      showToast('Customer registered!');
    }
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Customer removed', 'info');
  };

  // Inventory Stock (InventoryTab)
  const addOpeningStock = (rows) => {
    rows.forEach((r) => {
      if (!r.itemName || !r.quantity) return;
      setInventory((prev) => {
        const existing = prev.find(
          (inv) => inv.itemCode === r.itemCode || inv.itemName.toLowerCase() === r.itemName.toLowerCase()
        );
        const qty = parseFloat(r.quantity) || 0;
        const cost = parseFloat(r.costPrice) || 0;
        const mrp = parseFloat(r.mrp) || 0;
        if (existing) {
          return prev.map((inv) =>
            inv.id === existing.id
              ? {
                  ...inv,
                  availableQty: inv.availableQty + qty,
                  costPrice: cost || inv.costPrice,
                  mrp: mrp || inv.mrp,
                  stockValue: (inv.availableQty + qty) * (cost || inv.costPrice),
                }
              : inv
          );
        } else {
          return [
            ...prev,
            {
              id: Date.now() + Math.random(),
              itemCode: r.itemCode || '',
              itemName: r.itemName,
              availableQty: qty,
              costPrice: cost,
              mrp: mrp,
              stockValue: qty * cost,
            },
          ];
        }
      });
    });
    showToast('Opening stock saved to inventory!');
  };

  const deleteInventoryStock = (id) => {
    setInventory((prev) => prev.filter((inv) => inv.id !== id));
    showToast('Stock item deleted from inventory', 'info');
  };

  // Sales / POS (SellTab)
  const completeSale = (saleData) => {
    const newSale = {
      ...saleData,
      id: Date.now(),
      billId: saleData.billId || `BILL-${Date.now().toString().slice(-6)}`,
      dateStr: new Date().toLocaleDateString('en-GB'),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateTime: new Date().toISOString(),
      isDeleted: false,
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock in Inventory
    saleData.items.forEach((sold) => {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.itemCode === sold.code || inv.itemName.toLowerCase() === sold.name.toLowerCase()) {
            const rem = Math.max(0, inv.availableQty - sold.qty);
            return { ...inv, availableQty: rem, stockValue: rem * inv.costPrice };
          }
          return inv;
        })
      );
    });

    // Auto-register / update Customer
    if (saleData.customerMobile) {
      setCustomers((prev) => {
        const found = prev.find((c) => c.mobile === saleData.customerMobile);
        if (found) {
          return prev.map((c) =>
            c.mobile === saleData.customerMobile
              ? { ...c, name: saleData.customerName || c.name, lastVisit: newSale.dateStr }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: Date.now(),
              name: saleData.customerName || 'Walk-in Customer',
              mobile: saleData.customerMobile,
              lastVisit: newSale.dateStr,
            },
          ];
        }
      });
    }

    return newSale;
  };

  const deleteSale = (billId) => {
    setSales((prev) =>
      prev.map((s) => (s.billId === billId ? { ...s, isDeleted: true } : s))
    );
    showToast(`Bill ${billId} moved to Recycle Bin`, 'info');
  };

  const restoreSale = (billId) => {
    setSales((prev) =>
      prev.map((s) => (s.billId === billId ? { ...s, isDeleted: false } : s))
    );
    showToast(`Bill ${billId} restored successfully!`);
  };

  // Hold Bills (SellTab)
  const holdBill = (bill) => {
    const held = {
      ...bill,
      id: Date.now(),
      heldTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: new Date().toLocaleDateString('en-GB'),
    };
    setHeldBills((prev) => [held, ...prev]);
    showToast('Bill put on hold');
  };

  const resumeBill = (id) => {
    const bill = heldBills.find((b) => b.id === id);
    if (bill) {
      setHeldBills((prev) => prev.filter((b) => b.id !== id));
      return bill;
    }
    return null;
  };

  const deleteHeldBill = (id) => {
    setHeldBills((prev) => prev.filter((b) => b.id !== id));
    showToast('Held bill deleted', 'info');
  };

  // User Management (Settings)
  const addUser = (username, password) => {
    if (!username || !password) return;
    const exists = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      // Reset password
      setUsers((prev) =>
        prev.map((u) => (u.username.toLowerCase() === username.trim().toLowerCase() ? { ...u, password } : u))
      );
      showToast(`Password updated for user "${username}"`);
    } else {
      setUsers((prev) => [...prev, { id: Date.now(), username: username.trim(), password }]);
      showToast(`User "${username}" created!`);
    }
  };

  const deleteUser = (id) => {
    if (users.length <= 1) {
      showToast('Cannot delete the last remaining user!', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('User removed', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        login,
        logout,
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        toggleSidebar,
        theme,
        setTheme,
        businessDetails,
        setBusinessDetails,
        items,
        saveItem,
        deleteItem,
        inventory,
        addOpeningStock,
        deleteInventoryStock,
        purchases,
        addPurchase,
        deletePurchase,
        expenditures,
        saveExpenditure,
        deleteExpenditure,
        customers,
        saveCustomer,
        deleteCustomer,
        sales,
        completeSale,
        deleteSale,
        restoreSale,
        heldBills,
        holdBill,
        resumeBill,
        deleteHeldBill,
        users,
        addUser,
        deleteUser,
        receiptModalSale,
        setReceiptModalSale,
        a4ModalSale,
        setA4ModalSale,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
