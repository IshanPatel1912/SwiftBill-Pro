import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Truck,
  Plus,
  Download,
  Upload,
  Calendar,
  Trash2,
  Check
} from 'lucide-react';

export const PurchasesView = () => {
  const { items, purchases, addPurchase, deletePurchase, showToast } = useStore();

  // Add Item Form State
  const [pCode, setPCode] = useState('');
  const [pItem, setPItem] = useState('');
  const [pQty, setPQty] = useState('1');
  const [pCost, setPCost] = useState('');
  const [pMrp, setPMrp] = useState('');
  const [addToInventory, setAddToInventory] = useState(true);

  // History Filter
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  const handleCodeChange = (code) => {
    setPCode(code);
    const found = items.find((i) => i.itemCode?.toString() === code.trim());
    if (found) {
      setPItem(found.name);
      setPMrp(found.mrp ? found.mrp.toString() : '');
    }
  };

  const handleSavePurchase = (e) => {
    e.preventDefault();
    if (!pItem.trim() || !pQty || !pCost || !pMrp) {
      showToast('Please fill all purchase fields.', 'error');
      return;
    }

    const qtyVal = parseFloat(pQty);
    const costVal = parseFloat(pCost);
    const mrpVal = parseFloat(pMrp);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast('Invalid Quantity.', 'error');
      return;
    }

    addPurchase(
      {
        itemCode: pCode.trim() || '-',
        itemName: pItem.trim(),
        quantity: qtyVal,
        costPrice: costVal,
        mrp: mrpVal,
        inStock: addToInventory ? 'Yes' : 'No',
      },
      addToInventory
    );

    // Reset Form
    setPCode('');
    setPItem('');
    setPQty('1');
    setPCost('');
    setPMrp('');
  };

  const handleDeleteSelected = () => {
    if (!selectedPurchaseId) {
      showToast('Select a purchase row from history to delete.', 'info');
      return;
    }
    deletePurchase(selectedPurchaseId);
    setSelectedPurchaseId(null);
  };

  const handleSampleDownload = () => {
    const csv = "Code,Item Name,Quantity,Cost Price,MRP\n1,Sample Item 1,10,80.00,100.00\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "purchase_sample.csv";
    a.click();
    showToast('Downloaded purchase sample excel/csv');
  };

  const filteredPurchases = purchases.filter((p) => {
    if (!dateFilter) return true;
    return p.dateTime?.startsWith(dateFilter);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* --- 1. Add New Stock / Purchase Group (Matching purchase_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Add New Stock / Purchase
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSampleDownload}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Purchase Sample Excel</span>
            </button>
          </div>
        </div>

        {/* Single Item Entry Form */}
        <form onSubmit={handleSavePurchase} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Code:
            </label>
            <input
              type="text"
              placeholder="Code (1-100)"
              value={pCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Item: *
            </label>
            <input
              type="text"
              required
              placeholder="Item Name (Auto-fills)"
              value={pItem}
              onChange={(e) => setPItem(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Qty: *
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              required
              placeholder="e.g. 1"
              value={pQty}
              onChange={(e) => setPQty(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Cost: *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="Cost Price"
              value={pCost}
              onChange={(e) => setPCost(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              MRP: *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="MRP"
              value={pMrp}
              onChange={(e) => setPMrp(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right font-bold"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pb-1">
            <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={addToInventory}
                onChange={(e) => setAddToInventory(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span>In Stock?</span>
            </label>

            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
            >
              Add to Purchase
            </button>
          </div>
        </form>
      </div>

      {/* --- 2. Purchase History Group (Matching purchase_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Purchase History
          </h2>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-500 font-semibold px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Delete Selected Purchase
            </button>
          </div>
        </div>

        {/* Purchase History Table (8 Columns matching Python: ["ID", "Date", "Code", "Item Name", "Qty", "Cost", "MRP", "In Stock?"]) */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-28">Date</th>
                <th className="py-2.5 px-4 w-20">Code</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4 w-24 text-center">Qty</th>
                <th className="py-2.5 px-4 w-28 text-right">Cost</th>
                <th className="py-2.5 px-4 w-28 text-right">MRP</th>
                <th className="py-2.5 px-4 w-24 text-center">In Stock?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPurchaseId(p.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedPurchaseId === p.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.dateStr || p.dateTime?.split('T')[0]}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {p.itemCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.itemName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {p.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ₹{p.costPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      ₹{p.mrp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        {p.inStock || 'Yes'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
