import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  Printer,
  Smartphone,
  RotateCcw,
  Search,
  Check,
  User,
  CreditCard,
  IndianRupee,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export const PosView = () => {
  const { items, inventory, customers, createInvoice, setReceiptModalInvoice, showToast } = useStore();

  const [itemCodeInput, setItemCodeInput] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState('');

  // Cart
  const [cart, setCart] = useState([
    { code: "1", name: "Amul Butter 500g", unit: "pack", rate: 285.00, qty: 1, total: 285.00 },
    { code: "2", name: "Fortune Sunflower Oil 1L", unit: "ltr", rate: 165.00, qty: 2, total: 330.00 },
  ]);

  // Customer
  const [custName, setCustName] = useState('Priya Patel');
  const [custMobile, setCustMobile] = useState('9898011223');

  // Billing Details
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applyGst, setApplyGst] = useState(true);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI, Cash, Card, Credit

  const codeInputRef = useRef(null);

  // Auto-fill item when code matches
  const handleCodeChange = (code) => {
    setItemCodeInput(code);
    const found = items.find((i) => i.code.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      setSelectedItem(found);
      setRate(found.mrp.toString());
    } else {
      setSelectedItem(null);
    }
  };

  // Add Item to Cart
  const handleAddToCart = (e) => {
    if (e) e.preventDefault();
    if (!selectedItem && !itemCodeInput) return;

    const item = selectedItem || items.find((i) => i.code === itemCodeInput.trim());
    if (!item) {
      showToast('Item code not found in catalog!', 'error');
      return;
    }

    const itemRate = parseFloat(rate) || item.mrp;
    const quantity = parseFloat(qty) || 1;

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.code === item.code);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].qty + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          total: newQty * itemRate,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            code: item.code,
            name: item.name,
            unit: item.unit || 'pcs',
            rate: itemRate,
            qty: quantity,
            total: quantity * itemRate,
          },
        ];
      }
    });

    // Reset inputs
    setItemCodeInput('');
    setSelectedItem(null);
    setSearchQuery('');
    setQty(1);
    setRate('');
    codeInputRef.current?.focus();
    showToast(`Added ${item.name} to cart`);
  };

  const updateCartQty = (code, delta) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.code === code) {
            const newQty = it.qty + delta;
            return newQty > 0 ? { ...it, qty: newQty, total: newQty * it.rate } : null;
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (code) => {
    setCart((prev) => prev.filter((it) => it.code !== code));
  };

  const handleClearCart = () => {
    setCart([]);
    setCustName('');
    setCustMobile('');
    setDiscountPercent(0);
    showToast('Cart cleared', 'info');
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.total, 0);
  const discountAmount = (subtotal * (parseFloat(discountPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyGst ? taxableAmount * 0.05 : 0; // 5% composite tax estimate
  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Process Bill
  const handleCompleteBill = () => {
    if (cart.length === 0) {
      showToast('Please add items to cart before printing!', 'error');
      return;
    }

    const invoiceData = {
      customerName: custName || 'Walk-in Customer',
      customerMobile: custMobile || '',
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      grandTotal,
      paidAmount: isPaid ? grandTotal : 0,
      paymentMode,
      status: isPaid ? 'PAID' : 'DUE',
      cashier: 'admin',
    };

    const savedInvoice = createInvoice(invoiceData);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    // Open Thermal Receipt Modal
    setReceiptModalInvoice(savedInvoice);

    // Reset cart
    setCart([]);
    setCustName('');
    setCustMobile('');
    setDiscountPercent(0);
    showToast(`Bill ${savedInvoice.invoiceNo} generated successfully!`);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleCompleteBill();
      } else if (e.key === 'Escape') {
        // Clear
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, custName, custMobile, grandTotal]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Point of Sale Terminal</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Scan barcode or enter item code. Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">Enter</kbd> to add.
          </p>
        </div>

        {/* Customer Quick Lookup / Inputs */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <User className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Customer Name"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            className="w-36 text-xs bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <input
            type="text"
            placeholder="Mobile (10 Digits)"
            value={custMobile}
            onChange={(e) => setCustMobile(e.target.value)}
            className="w-36 text-xs bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400 font-mono"
          />
        </div>
      </div>

      {/* Main POS Interface Grid: Left Item Selector & Cart, Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Add Item Bar + Cart Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Add Item Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleAddToCart} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Item Code Input */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Item Code / Scan
                </label>
                <div className="relative">
                  <input
                    ref={codeInputRef}
                    type="text"
                    value={itemCodeInput}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. 1, 2, 5"
                    autoFocus
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Item Search / Selector */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Item Description
                </label>
                <select
                  value={selectedItem ? selectedItem.code : ''}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose Item ({items.length} in catalog) --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.code}>
                      [{i.code}] {i.name} - ₹{i.mrp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Rate */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Rate (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="submit"
                  className="w-full h-[38px] rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center font-bold transition-all shadow-sm shadow-brand-500/20 active:scale-95"
                  title="Add item to current bill"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Cart Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Current Cart ({cart.length} line {cart.length === 1 ? 'item' : 'items'})
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <ShoppingBag className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs">Type an item code above or select from the dropdown</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 w-16">Code</th>
                      <th className="py-2.5 px-4">Item Name</th>
                      <th className="py-2.5 px-4 w-20 text-right">Price</th>
                      <th className="py-2.5 px-4 w-28 text-center">Quantity</th>
                      <th className="py-2.5 px-4 w-24 text-right">Total</th>
                      <th className="py-2.5 px-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cart.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">Unit: {item.unit}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{item.rate.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => updateCartQty(item.code, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-6 text-center text-slate-900 dark:text-white">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.code, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.code)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Bill Calculation & Checkout Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
              Payment Summary
            </h2>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <span>Discount (%):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-16 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
                  <span>Discount Amount:</span>
                  <span className="font-mono font-semibold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* GST Checkbox */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyGst}
                    onChange={(e) => setApplyGst(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <span>Apply GST (5% composite)</span>
                </label>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  +₹{taxAmount.toFixed(2)}
                </span>
              </div>

              {/* Grand Total Box */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline justify-between bg-brand-50 dark:bg-brand-950/40 p-3 rounded-xl border border-brand-200 dark:border-brand-800/80">
                  <div>
                    <span className="block text-[11px] font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                      Grand Total
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {cart.reduce((s, x) => s + x.qty, 0)} total units
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-brand-700 dark:text-brand-300">
                    ₹{grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['UPI', 'Cash', 'Card', 'Credit'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      paymentMode === mode
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Mark as Paid Checkbox (Verified UI fix) */}
            <div className="pt-1 flex items-center space-x-2">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                <div
                  onClick={() => setIsPaid(!isPaid)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                    isPaid
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span>Mark Bill as Paid</span>
              </label>
            </div>

            {/* Complete Bill / Print Action */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleCompleteBill}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Print & Save Bill (F1)</span>
              </button>

              <button
                onClick={handleCompleteBill}
                disabled={cart.length === 0}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Send WhatsApp Receipt Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
