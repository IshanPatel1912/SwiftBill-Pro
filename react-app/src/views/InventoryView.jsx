import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  ArrowUpDown,
  CheckCircle,
  X
} from 'lucide-react';

export const InventoryView = () => {
  const { inventory, adjustStock } = useStore();

  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [newStockQty, setNewStockQty] = useState('');

  const totalValuation = inventory.reduce((sum, it) => sum + it.stock * it.purchaseRate, 0);
  const totalRetailValue = inventory.reduce((sum, it) => sum + it.stock * it.sellingPrice, 0);
  const lowStockItems = inventory.filter((it) => it.stock <= it.reorderLevel);

  const filteredInventory = inventory.filter((it) => {
    const matchSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.itemCode.toLowerCase().includes(search.toLowerCase());
    const matchLow = filterLowStock ? it.stock <= it.reorderLevel : true;
    return matchSearch && matchLow;
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    const qty = parseInt(newStockQty);
    if (!isNaN(qty)) {
      adjustStock(adjustModalItem.itemCode, qty);
    }
    setAdjustModalItem(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor on-hand inventory levels, track cost valuation, and manage reorders.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valuation */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Stock Valuation (Cost)
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Based on supplier purchase rates
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Retail Value */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Retail Value (MRP)
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              ₹{totalRetailValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Estimated customer realization
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Stocked Items */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Stock Items
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              {inventory.length}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              All categories tracked
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Low Stock Warnings */}
        <div
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            filterLowStock
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${filterLowStock ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Low Stock Warnings
            </span>
            <div className={`text-xl font-extrabold font-mono mt-1 ${filterLowStock ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
              {lowStockItems.length} Products
            </div>
            <span className={`text-[10px] ${filterLowStock ? 'text-amber-100' : 'text-slate-400'}`}>
              {filterLowStock ? 'Showing low stock only (click to clear)' : 'Click to filter low stock'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${filterLowStock ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by product name or item code..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>
        {filterLowStock && (
          <button
            onClick={() => setFilterLowStock(false)}
            className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
          >
            <span>Showing Low Stock ({lowStockItems.length})</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16">Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 w-28 text-center">Available Stock</th>
                <th className="py-3 px-4 w-28 text-right">Cost Price</th>
                <th className="py-3 px-4 w-28 text-right">Selling Price</th>
                <th className="py-3 px-4 w-32 text-right">Inventory Value</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-24 text-center">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventory.map((item) => {
                const isLow = item.stock <= item.reorderLevel;
                const isOut = item.stock === 0;
                const value = item.stock * item.purchaseRate;

                return (
                  <tr key={item.itemCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {item.itemCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block font-mono font-bold text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                        {item.stock} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      ₹{item.purchaseRate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      ₹{item.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{value.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          Low Stock ({item.stock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setNewStockQty(item.stock.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Adjust Physical Stock
              </h3>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Item:</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  [{adjustModalItem.itemCode}] {adjustModalItem.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Verified Quantity on Shelf
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(e.target.value)}
                  className="w-full text-base font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
