import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Plus,
  Trash2,
  Clock,
  User,
  Phone,
  RotateCcw,
  Printer,
  PauseCircle,
  Play,
  X,
  Check
} from 'lucide-react';

export const PosView = () => {
  const {
    items,
    inventory,
    completeSale,
    heldBills,
    holdBill,
    resumeBill,
    deleteHeldBill,
    setReceiptModalSale,
    showToast
  } = useStore();

  const [billId, setBillId] = useState(() => `BILL-${Date.now().toString().slice(-6)}`);
  const [dateTimeStr, setDateTimeStr] = useState(() =>
    new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Customer
  const [custName, setCustName] = useState('Walk-in Customer');
  const [custMobile, setCustMobile] = useState('');

  // Item Input
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState('1.0');
  const [unit, setUnit] = useState('piece');
  const [rate, setRate] = useState('');

  // Cart Table: ["Sr.", "Code", "Item Description", "Qty", "Unit", "Rate", "Amount"]
  const [cart, setCart] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  // Discounts & Totals
  const [discountPct, setDiscountPct] = useState('0.00');
  const [discountAmt, setDiscountAmt] = useState('0.00');
  const [isPaid, setIsPaid] = useState(true);

  // Held Bills Dialog
  const [showHoldDialog, setShowHoldDialog] = useState(false);

  const codeInputRef = useRef(null);

  // Autocomplete on Code
  const handleCodeChange = (code) => {
    setItemCode(code);
    const found = items.find((i) => i.itemCode?.toString() === code.trim());
    if (found) {
      setItemName(found.name);
      setRate(found.mrp ? found.mrp.toString() : '');
      setUnit(found.unit || 'piece');
    }
  };

  // Autocomplete on Name
  const handleNameChange = (name) => {
    setItemName(name);
    const found = items.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());
    if (found) {
      setItemCode(found.itemCode || '');
      setRate(found.mrp ? found.mrp.toString() : '');
      setUnit(found.unit || 'piece');
    }
  };

  // Add Item to Table
  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    if (!itemName && !itemCode) return;

    const rateVal = parseFloat(rate);
    const qtyVal = parseFloat(qty);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast('Quantity must be greater than zero.', 'error');
      return;
    }
    if (isNaN(rateVal) || rateVal < 0) {
      showToast('Invalid Rate / MRP.', 'error');
      return;
    }

    const amt = qtyVal * rateVal;
    const finalCode = itemCode.trim() || '-';
    const finalName = itemName.trim();

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => (it.code === finalCode || it.name.toLowerCase() === finalName.toLowerCase()) && it.rate === rateVal
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].qty + qtyVal;
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: newQty,
          amount: newQty * rateVal,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            sr: prev.length + 1,
            code: finalCode,
            name: finalName,
            qty: qtyVal,
            unit: unit || 'piece',
            rate: rateVal,
            amount: amt,
          },
        ];
      }
    });

    // Reset item inputs
    setItemCode('');
    setItemName('');
    setRate('');
    setQty('1.0');
    codeInputRef.current?.focus();
  };

  const handleDeleteItem = () => {
    if (selectedRow === null) {
      showToast('Select an item row in the cart to delete.', 'info');
      return;
    }
    setCart((prev) =>
      prev
        .filter((_, idx) => idx !== selectedRow)
        .map((it, idx) => ({ ...it, sr: idx + 1 }))
    );
    setSelectedRow(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, it) => sum + it.amount, 0);

  const handleDiscountPctChange = (val) => {
    setDiscountPct(val);
    const pct = parseFloat(val) || 0;
    const amt = (subtotal * pct) / 100;
    setDiscountAmt(amt.toFixed(2));
  };

  const handleDiscountAmtChange = (val) => {
    setDiscountAmt(val);
    const amt = parseFloat(val) || 0;
    const pct = subtotal > 0 ? (amt / subtotal) * 100 : 0;
    setDiscountPct(pct.toFixed(2));
  };

  const finalDiscount = parseFloat(discountAmt) || 0;
  const grandTotal = Math.max(0, subtotal - finalDiscount);

  // Save Bill
  const handleSaveBill = () => {
    if (cart.length === 0) {
      showToast('Cannot save an empty bill! Add items first.', 'error');
      return;
    }

    const saleData = {
      billId,
      customerName: custName.trim() || 'Walk-in Customer',
      customerMobile: custMobile.trim(),
      items: cart,
      subtotal,
      discount: finalDiscount,
      grandTotal,
      paidStatus: isPaid,
    };

    const saved = completeSale(saleData);
    setReceiptModalSale(saved);

    // Reset Form for next customer
    setCart([]);
    setSelectedRow(null);
    setCustName('Walk-in Customer');
    setCustMobile('');
    setDiscountPct('0.00');
    setDiscountAmt('0.00');
    setBillId(`BILL-${Date.now().toString().slice(-6)}`);
    setDateTimeStr(
      new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    showToast(`Bill ${saved.billId} saved successfully!`);
  };

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Nothing to put on hold.', 'info');
      return;
    }
    holdBill({
      billId,
      customerName: custName,
      customerMobile: custMobile,
      items: cart,
      subtotal,
      discount: finalDiscount,
      grandTotal,
    });
    // Clear
    setCart([]);
    setSelectedRow(null);
    setCustName('Walk-in Customer');
    setCustMobile('');
    setBillId(`BILL-${Date.now().toString().slice(-6)}`);
  };

  const handleResumeBill = (id) => {
    const resumed = resumeBill(id);
    if (resumed) {
      setCart(resumed.items);
      setCustName(resumed.customerName || 'Walk-in Customer');
      setCustMobile(resumed.customerMobile || '');
      setShowHoldDialog(false);
      showToast('Held bill resumed!');
    }
  };

  // Reset form
  const handleClearForm = () => {
    setCart([]);
    setSelectedRow(null);
    setCustName('Walk-in Customer');
    setCustMobile('');
    setDiscountPct('0.00');
    setDiscountAmt('0.00');
    setItemCode('');
    setItemName('');
    setRate('');
    setQty('1.0');
    setBillId(`BILL-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* 1. Top Bar: Bill Details, Customer & Hold Bills Group */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">Bill ID:</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold text-sm">
                {billId}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{dateTimeStr}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleHoldBill}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Hold Bill
            </button>
            <button
              onClick={() => setShowHoldDialog(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Hold Bills ({heldBills.length})
            </button>
          </div>
        </div>

        {/* Customer Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-12 shrink-0">
              Name:
            </span>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="Customer Name (e.g. Walk-in Customer)"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-14 shrink-0">
              Mobile:
            </span>
            <input
              type="text"
              value={custMobile}
              onChange={(e) => setCustMobile(e.target.value)}
              placeholder="Mobile Number (Optional)"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl">
              WhatsApp Auto-Send Active
            </span>
          </div>
        </div>
      </div>

      {/* 2. Add Item Section (Exact QGridLayout from sell_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Item Code */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Item Code:
            </label>
            <input
              ref={codeInputRef}
              type="text"
              placeholder="Code (1-100)"
              value={itemCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Product Name */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Product Name:
            </label>
            <input
              type="text"
              placeholder="Select or Type Product Name"
              value={itemName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Qty (Unit) */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Qty (Unit):
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
            />
          </div>

          {/* Rate / MRP */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Rate / MRP:
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right font-bold"
            />
          </div>

          {/* Action Buttons */}
          <div className="sm:col-span-2 flex space-x-1.5">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              ➕ Add
            </button>
            <button
              type="button"
              onClick={handleDeleteItem}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
              title="Delete Selected Item"
            >
              🗑️
            </button>
          </div>
        </form>
      </div>

      {/* 3. Items Table (Exact 7 columns: ["Sr.", "Code", "Item Description", "Qty", "Unit", "Rate", "Amount"]) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                <th className="py-2.5 px-3 w-28 text-right">Rate</th>
                <th className="py-2.5 px-3 w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cart.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No items in cart. Type Item Code or Product Name above to add.
                  </td>
                </tr>
              ) : (
                cart.map((it, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRow(idx)}
                    className={`cursor-pointer transition-colors ${
                      selectedRow === idx
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {it.sr}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {it.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {it.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {it.qty}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {it.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₹{it.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{it.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Section: Totals, Discounts, Thermal Print & Save (Matching sell_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mark as Paid Checkbox + Clear Form Button */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
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
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Mark as Paid
            </span>
          </label>

          <button
            onClick={handleClearForm}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
          >
            Clear Form
          </button>
        </div>

        {/* Right: Subtotal, Disc %, Disc ₹, Total, Save Bill */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
            Subtotal: ₹{subtotal.toFixed(2)}
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500">Disc (%):</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPct}
              onChange={(e) => handleDiscountPctChange(e.target.value)}
              className="w-14 text-center py-1 px-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500">Disc (₹):</span>
            <input
              type="number"
              min="0"
              value={discountAmt}
              onChange={(e) => handleDiscountAmtChange(e.target.value)}
              className="w-16 text-right py-1 px-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
            />
          </div>

          <div className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 px-2">
            Total: ₹{grandTotal.toFixed(2)}
          </div>

          <button
            onClick={handleSaveBill}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            💾 Save Bill
          </button>
        </div>
      </div>

      {/* Held Bills Dialog */}
      {showHoldDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Held Bills: Select a bill to resume checkout or delete
              </h3>
              <button
                onClick={() => setShowHoldDialog(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {heldBills.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No held bills in queue.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-2 px-3">Held Time</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Items Summary</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                      <th className="py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {heldBills.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5 px-3 font-mono">{b.heldTime}</td>
                        <td className="py-2.5 px-3 font-semibold">{b.customerName}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {b.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ₹{b.grandTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex justify-center space-x-1.5">
                            <button
                              onClick={() => handleResumeBill(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                            >
                              Resume
                            </button>
                            <button
                              onClick={() => deleteHeldBill(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHoldDialog(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
