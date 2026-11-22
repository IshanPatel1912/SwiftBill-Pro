import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Users,
  RefreshCw,
  Download,
  Trash2,
  Save
} from 'lucide-react';

export const CustomersView = () => {
  const { customers, saveCustomer, deleteCustomer, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.mobile?.includes(s)
    );
  });

  const handleRowClick = (cust) => {
    setSelectedCustomerId(cust.id);
    setName(cust.name);
    setMobile(cust.mobile);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter Customer Name.', 'error');
      return;
    }

    saveCustomer({
      id: selectedCustomerId,
      name: name.trim(),
      mobile: mobile.trim(),
    });

    handleClear();
  };

  const handleClear = () => {
    setSelectedCustomerId(null);
    setName('');
    setMobile('');
  };

  const handleDelete = () => {
    if (!selectedCustomerId) {
      showToast('Select a customer row to delete.', 'info');
      return;
    }
    deleteCustomer(selectedCustomerId);
    handleClear();
  };

  const handleExportPdf = () => {
    window.print();
    showToast('Exporting customer directory PDF...');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Top Controls (Search, Refresh, Export PDF matching customer_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] max-w-md">
          <input
            type="text"
            placeholder="Search by Name or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSearch('')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📄 Export Customer Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Table (Columns: ["ID", "Customer Name", "Mobile Number", "Last Visit"] matching customer_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[340px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Customer Name</th>
                <th className="py-2.5 px-4 w-48">Mobile Number</th>
                <th className="py-2.5 px-4 w-36 text-center">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-400">
                    No registered customers. Add customer records below or during POS billing.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c)}
                    className={`cursor-pointer transition-colors ${
                      selectedCustomerId === c.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.mobile || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {c.lastVisit || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Section: Add / Edit Customer (Matching customer_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Add / Edit Customer
        </h2>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Name: *
            </label>
            <input
              type="text"
              required
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Mobile:
            </label>
            <input
              type="text"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Save Customer
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              Clear
            </button>
            {selectedCustomerId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
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
