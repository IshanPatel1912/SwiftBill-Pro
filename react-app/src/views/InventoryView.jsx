import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Boxes,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  X
} from 'lucide-react';

export const InventoryView = () => {
  const { inventory, addOpeningStock, deleteInventoryStock, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Bulk Opening Stock Rows
  const [rows, setRows] = useState([
    { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
    { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
    { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
  ]);

  const filteredInventory = inventory.filter((inv) => {
    const s = search.toLowerCase();
    return (
      inv.itemName?.toLowerCase().includes(s) ||
      inv.itemCode?.toString().toLowerCase().includes(s)
    );
  });

  const totalStockValue = inventory.reduce((sum, it) => sum + (it.stockValue || 0), 0);

  const handleDeleteSelected = () => {
    if (!selectedStockId) {
      showToast('Select an inventory stock row to delete.', 'info');
      return;
    }
    deleteInventoryStock(selectedStockId);
    setSelectedStockId(null);
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' }]);
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSaveBulkStock = (e) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.itemName.trim() && r.quantity);
    if (validRows.length === 0) {
      showToast('Please enter at least one valid item with name and quantity.', 'error');
      return;
    }
    addOpeningStock(validRows);
    setShowAddModal(false);
    setRows([
      { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
      { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
      { itemCode: '', itemName: '', quantity: '', costPrice: '', mrp: '' },
    ]);
  };

  const handleExportPdf = () => {
    window.print();
    showToast('Exporting inventory valuation sheet...');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* --- TOP HEADER CONTROLS (Matching inventory_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] max-w-md">
          <input
            type="text"
            placeholder="Search Inventory by Code or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSearch('')}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>➕ Add Opening Stock</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📄 Export Stock Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* --- TABLE (Exact 7 Columns matching inventory_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[360px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-28">Item Code</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4 w-32 text-center">Available Qty</th>
                <th className="py-2.5 px-4 w-32 text-right">Cost Price (₹)</th>
                <th className="py-2.5 px-4 w-32 text-right">MRP (₹)</th>
                <th className="py-2.5 px-4 w-36 text-right">Stock Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No inventory records found. Click "➕ Add Opening Stock" above to add items.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedStockId(inv.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedStockId === inv.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {inv.itemCode || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {inv.itemName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {inv.availableQty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ₹{inv.costPrice ? inv.costPrice.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      ₹{inv.mrp ? inv.mrp.toFixed(2) : '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{inv.stockValue ? inv.stockValue.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BOTTOM SUMMARY (Matching inventory_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
        <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
          Total Inventory Value: ₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>

        <button
          onClick={handleDeleteSelected}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
        >
          Delete Selected Stock
        </button>
      </div>

      {/* --- ADD OPENING STOCK MODAL (Matching AddOpeningStockDialog from inventory_tab.py) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add Opening Stock (Bulk Entry)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Add multiple inventory items below.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkStock} className="p-4 space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-24">Item Code</th>
                      <th className="py-2 px-3">Item Name *</th>
                      <th className="py-2 px-3 w-24">Quantity *</th>
                      <th className="py-2 px-3 w-28">Cost Price</th>
                      <th className="py-2 px-3 w-28">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Code"
                            value={r.itemCode}
                            onChange={(e) => handleRowChange(i, 'itemCode', e.target.value)}
                            className="w-full text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Product Name"
                            value={r.itemName}
                            onChange={(e) => handleRowChange(i, 'itemName', e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="Qty"
                            value={r.quantity}
                            onChange={(e) => handleRowChange(i, 'quantity', e.target.value)}
                            className="w-full text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="Cost"
                            value={r.costPrice}
                            onChange={(e) => handleRowChange(i, 'costPrice', e.target.value)}
                            className="w-full text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="MRP"
                            value={r.mrp}
                            onChange={(e) => handleRowChange(i, 'mrp', e.target.value)}
                            className="w-full text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  ➕ Add Another Row
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
                  >
                    Save Stock
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
