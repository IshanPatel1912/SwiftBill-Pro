import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Tag,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

export const ItemsView = () => {
  const { items, saveItem, deleteItem, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    mrp: '',
    unit: 'piece',
  });

  const unitOptions = ['piece', 'kg', 'gram', 'litre', 'ml', 'packet', 'box'];

  const filteredItems = items.filter((it) => {
    const s = search.toLowerCase();
    return (
      it.name?.toLowerCase().includes(s) ||
      it.itemCode?.toString().toLowerCase().includes(s)
    );
  });

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setFormData({
      itemCode: item.itemCode || '',
      name: item.name || '',
      mrp: item.mrp ? item.mrp.toString() : '',
      unit: item.unit || 'piece',
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mrp) {
      showToast('Please provide Product Name and MRP.', 'error');
      return;
    }

    const mrpVal = parseFloat(formData.mrp);
    if (isNaN(mrpVal) || mrpVal < 0) {
      showToast('Invalid MRP amount.', 'error');
      return;
    }

    const payload = {
      id: selectedItem ? selectedItem.id : Date.now(),
      itemCode: formData.itemCode.trim(),
      name: formData.name.trim(),
      mrp: mrpVal,
      unit: formData.unit || 'piece',
    };

    saveItem(payload);
    handleClear();
  };

  const handleClear = () => {
    setSelectedItem(null);
    setFormData({
      itemCode: '',
      name: '',
      mrp: '',
      unit: 'piece',
    });
  };

  const handleDelete = () => {
    if (!selectedItem) {
      showToast('Select an item row from the table to delete.', 'info');
      return;
    }
    deleteItem(selectedItem.id);
    handleClear();
  };

  const handleDownloadSample = () => {
    const csvContent = "item_code,item_name,mrp,qty_type\n1,Sample Item 1,100.00,piece\n2,Sample Item 2,250.00,kg\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "item_master_sample.csv";
    a.click();
    showToast('Downloaded sample excel/csv template');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* --- TOP CONTROLS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] max-w-md">
          <input
            type="text"
            placeholder="Search by Item Code or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSearch('')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleDownloadSample}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample Excel</span>
          </button>
        </div>
      </div>

      {/* --- ITEMS TABLE (Exact 5 Columns matching item_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[340px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-28">Item Code</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4 w-36 text-right">MRP per Qty (₹)</th>
                <th className="py-2.5 px-4 w-36 text-center">Qty Type (Unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400">
                    No items in catalog. Use the form below to add your first product.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {item.itemCode || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{item.mrp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {item.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT ITEM FORM (Matching item_tab.py) --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          {selectedItem ? 'Edit Item Details' : 'Add Item to Master Catalog'}
        </h2>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Item Code:
            </label>
            <input
              type="text"
              placeholder="e.g. 1"
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Item Name: *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dairy Milk Chocolate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              MRP per Qty (₹): *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Qty Type (Unit):
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Save Item
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              title="Clear form"
            >
              Clear
            </button>
            {selectedItem && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                title="Delete item"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
