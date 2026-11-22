import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getTodayDateString } from '../utils/dateUtils';
import {
  Receipt,
  Trash2,
  Calendar,
  X
} from 'lucide-react';

export const ExpendituresView = () => {
  const { expenditures, saveExpenditure, deleteExpenditure, showToast } = useStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Filter - Defaults to Today matching desktop Python
  const [dateFilter, setDateFilter] = useState(() => getTodayDateString());
  const [selectedId, setSelectedId] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      showToast('Please provide Description and Amount.', 'error');
      return;
    }

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      showToast('Invalid Amount', 'error');
      return;
    }

    saveExpenditure({
      id: editingId,
      description: description.trim(),
      amount: amtVal,
      date: new Date().toLocaleDateString('en-GB'),
    });

    handleClear();
  };

  const handleRowClick = (item) => {
    setSelectedId(item.id);
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(item.amount.toString());
  };

  const handleClear = () => {
    setEditingId(null);
    setSelectedId(null);
    setDescription('');
    setAmount('');
  };

  const handleDeleteSelected = () => {
    if (!selectedId) {
      showToast('Select an expense row from the table to delete.', 'info');
      return;
    }
    deleteExpenditure(selectedId);
    handleClear();
  };

  const filteredExpenses = expenditures.filter((e) => {
    if (!dateFilter) return true;
    return e.dateTime?.startsWith(dateFilter);
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Form (Description, Amount, Add Expense Button - Matching expenditure_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-7">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="Description (e.g. Electricity Bill)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right"
            />
          </div>

          <div className="sm:col-span-2 flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              {editingId ? 'Update Expense' : 'Add Expense'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter Row: Date, Filter Date, Delete Selected (Matching expenditure_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Date:
          </span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-2 text-slate-400 hover:text-slate-600"
              title="Clear date filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleDeleteSelected}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          Delete Selected
        </button>
      </div>

      {/* Table (Columns: ["ID", "Date", "Description", "Amount"] matching expenditure_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-32">Date</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-36 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-400">
                    No expenditure recorded. Use the form above to add an expense.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => handleRowClick(e)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === e.id
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {e.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      ₹{e.amount.toFixed(2)}
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
