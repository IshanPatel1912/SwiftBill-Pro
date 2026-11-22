import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialBusinessDetails,
  initialItems,
  initialInventory,
  initialCustomers,
  initialInvoices,
  initialPurchases,
  initialExpenditures,
  initialUsers
} from '../data/mockData';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  // Helper to load persisted state or fallback
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`swiftbill_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage`, e);
      return fallback;
    }
  };

  const [activeTab, setActiveTab] = useState('pos'); // pos, items, inventory, purchase, expenditure, find_bill, analytics, portfolio, customers, settings
  const [theme, setTheme] = useState(() => localStorage.getItem('swiftbill_theme') || 'system');
  
  const [businessDetails, setBusinessDetails] = useState(() => loadState('business', initialBusinessDetails));
  const [items, setItems] = useState(() => loadState('items', initialItems));
  const [inventory, setInventory] = useState(() => loadState('inventory', initialInventory));
  const [customers, setCustomers] = useState(() => loadState('customers', initialCustomers));
  const [invoices, setInvoices] = useState(() => loadState('invoices', initialInvoices));
  const [purchases, setPurchases] = useState(() => loadState('purchases', initialPurchases));
  const [expenditures, setExpenditures] = useState(() => loadState('expenditures', initialExpenditures));
  const [users, setUsers] = useState(() => loadState('users', initialUsers));

  // Modal States
  const [receiptModalInvoice, setReceiptModalInvoice] = useState(null);
  const [a4ModalInvoice, setA4ModalInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('swiftbill_business', JSON.stringify(businessDetails));
  }, [businessDetails]);

  useEffect(() => {
    localStorage.setItem('swiftbill_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('swiftbill_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('swiftbill_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('swiftbill_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('swiftbill_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('swiftbill_expenditures', JSON.stringify(expenditures));
  }, [expenditures]);

  useEffect(() => {
    localStorage.setItem('swiftbill_users', JSON.stringify(users));
  }, [users]);

  // Handle Theme Switching
  useEffect(() => {
    localStorage.setItem('swiftbill_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System default
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Add Item to Master Catalog
  const addItem = (item) => {
    const newItem = {
      ...item,
      id: Date.now(),
      code: item.code.trim(),
    };
    setItems((prev) => [...prev, newItem]);
    
    // Also create inventory record if not present
    setInventory((prev) => [
      ...prev,
      {
        itemCode: newItem.code,
        name: newItem.name,
        stock: parseInt(item.initialStock || 0),
        purchaseRate: parseFloat(item.purchaseRate || 0),
        sellingPrice: parseFloat(item.mrp || 0),
        reorderLevel: 10,
        unit: newItem.unit || 'pcs'
      }
    ]);
    showToast(`Item "${newItem.name}" added successfully!`);
  };

  const updateItem = (id, updated) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
    showToast('Item updated successfully!');
  };

  const deleteItem = (id) => {
    const it = items.find((x) => x.id === id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (it) {
      setInventory((prev) => prev.filter((inv) => inv.itemCode !== it.code));
    }
    showToast('Item removed from catalog', 'info');
  };

  // Adjust Inventory Stock
  const adjustStock = (itemCode, newQty) => {
    setInventory((prev) =>
      prev.map((inv) => (inv.itemCode === itemCode ? { ...inv, stock: Math.max(0, newQty) } : inv))
    );
    showToast('Stock quantity updated!');
  };

  // Create Bill / Invoice
  const createInvoice = (invoiceData) => {
    const newInv = {
      ...invoiceData,
      id: Date.now(),
      invoiceNo: `INV-${1000 + invoices.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setInvoices((prev) => [newInv, ...prev]);

    // Deduct stock in inventory
    invoiceData.items.forEach((sold) => {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.itemCode === sold.code) {
            return { ...inv, stock: Math.max(0, inv.stock - sold.qty) };
          }
          return inv;
        })
      );
    });

    // Update Customer stats if customer exists
    if (invoiceData.customerMobile) {
      setCustomers((prev) => {
        const existing = prev.find((c) => c.phone === invoiceData.customerMobile);
        if (existing) {
          return prev.map((c) =>
            c.phone === invoiceData.customerMobile
              ? {
                  ...c,
                  totalBills: c.totalBills + 1,
                  totalSpend: c.totalSpend + invoiceData.grandTotal,
                  lastVisit: newInv.date,
                }
              : c
          );
        } else if (invoiceData.customerName) {
          return [
            ...prev,
            {
              id: Date.now(),
              name: invoiceData.customerName,
              phone: invoiceData.customerMobile,
              address: '',
              totalBills: 1,
              totalSpend: invoiceData.grandTotal,
              lastVisit: newInv.date,
            },
          ];
        }
        return prev;
      });
    }

    return newInv;
  };

  // Add Purchase
  const addPurchase = (purchase) => {
    const newPur = {
      ...purchase,
      id: Date.now(),
      invoiceNo: purchase.invoiceNo || `PUR-${8800 + purchases.length + 1}`,
      date: purchase.date || new Date().toISOString().split('T')[0],
    };
    setPurchases((prev) => [newPur, ...prev]);
    showToast(`Purchase inward recorded (${newPur.invoiceNo})!`);
  };

  // Add Expense
  const addExpenditure = (exp) => {
    const newExp = {
      ...exp,
      id: Date.now(),
      date: exp.date || new Date().toISOString().split('T')[0],
    };
    setExpenditures((prev) => [newExp, ...prev]);
    showToast(`Expense of ₹${exp.amount} recorded!`);
  };

  const deleteExpenditure = (id) => {
    setExpenditures((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense entry deleted', 'info');
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    setBusinessDetails(initialBusinessDetails);
    setItems(initialItems);
    setInventory(initialInventory);
    setCustomers(initialCustomers);
    setInvoices(initialInvoices);
    setPurchases(initialPurchases);
    setExpenditures(initialExpenditures);
    setUsers(initialUsers);
    showToast('All sample store data has been re-loaded!');
  };

  return (
    <StoreContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        businessDetails,
        setBusinessDetails,
        items,
        addItem,
        updateItem,
        deleteItem,
        inventory,
        adjustStock,
        customers,
        invoices,
        createInvoice,
        purchases,
        addPurchase,
        expenditures,
        addExpenditure,
        deleteExpenditure,
        users,
        receiptModalInvoice,
        setReceiptModalInvoice,
        a4ModalInvoice,
        setA4ModalInvoice,
        toast,
        showToast,
        resetToDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
