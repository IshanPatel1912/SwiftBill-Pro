import React, { useState, useRef } from 'react';
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
  const { items, saveItem, deleteItem, importItemsBulk, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleDownloadSample = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = ["item_code", "name", "mrp", "qty_type"];
      const sampleData = [
        headers,
        ["1", "Sugar M-30", 45.0, "kg"],
        ["2", "Basmati Rice 1kg", 95.0, "kg"],
        ["3", "Sunflower Oil 1L", 140.0, "litre"],
        ["4", "Amul Butter 100g", 58.0, "piece"],
        ["5", "Parle-G Biscuit 250g", 25.0, "packet"],
        ["6", "Milk Pouch 500ml", 32.0, "packet"],
        ["7", "Atta / Wheat Flour", 40.0, "kg"],
        ["8", "Bath Soap 125g", 35.0, "piece"]
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Items");
      XLSX.writeFile(wb, "Sample_Items_Catalog.xlsx");
      showToast('Sample Excel catalog downloaded successfully!');
    } catch (e) {
      showToast(`Failed to generate sample Excel: ${e.message}`, 'error');
    }
  };

  const handleImportExcelClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rows || rows.length < 2) {
          showToast('Excel file has no data rows. Must contain header + data.', 'error');
          return;
        }

        // Determine column indexes from header
        const rawHeaders = rows[0] || [];
        const headers = rawHeaders.map((h) =>
          String(h || '').toLowerCase().replace(/[\s_.]/g, '')
        );

        let codeIdx = -1;
        let nameIdx = -1;
        let mrpIdx = -1;
        let unitIdx = -1;

        headers.forEach((h, idx) => {
          if (h.includes('code')) codeIdx = idx;
          else if (h.includes('name') || h.includes('title') || h.includes('item')) nameIdx = idx;
          else if (h.includes('mrp') || h.includes('price') || h.includes('rate')) mrpIdx = idx;
          else if (h.includes('type') || h.includes('unit') || h.includes('qty')) unitIdx = idx;
        });

        // Fallbacks
        if (codeIdx === -1 && headers.length > 0) codeIdx = 0;
        if (nameIdx === -1 && headers.length > 1) nameIdx = 1;
        if (mrpIdx === -1 && headers.length > 2) mrpIdx = 2;
        if (unitIdx === -1 && headers.length > 3) unitIdx = 3;

        if (codeIdx === -1 || nameIdx === -1) {
          showToast("Could not locate 'item_code' and 'name' columns in the Excel file.", 'error');
          return;
        }

        const itemsList = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row.some((c) => c !== null && c !== undefined && c !== '')) continue;

          let code = String(row[codeIdx] ?? '').trim();
          if (code.endsWith('.0')) code = code.slice(0, -2);

          const name = String(row[nameIdx] ?? '').trim();
          if (!code || !name) continue;

          let mrpVal = 0;
          if (mrpIdx !== -1 && row[mrpIdx] !== undefined) {
            const rawMrp = String(row[mrpIdx]).replace(/[₹,]/g, '').trim();
            mrpVal = parseFloat(rawMrp) || 0;
          }

          let unitVal = 'piece';
          if (unitIdx !== -1 && row[unitIdx]) {
            unitVal = String(row[unitIdx]).trim().toLowerCase() || 'piece';
          }

          itemsList.push({
            itemCode: code,
            name,
            mrp: mrpVal,
            unit: unitVal,
          });
        }

        if (itemsList.length === 0) {
          showToast('No valid item rows found in file.', 'error');
          return;
        }

        importItemsBulk(itemsList);
      } catch (err) {
        showToast(`Failed reading Excel file: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Hidden Excel File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

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
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleDownloadSample}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample Excel</span>
          </button>

          <button
            onClick={handleImportExcelClick}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Items via Excel</span>
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
