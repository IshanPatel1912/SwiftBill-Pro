import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getTodayDateString } from '../utils/dateUtils';
import {
  Home,
  RefreshCw,
  ShoppingBag,
  Receipt
} from 'lucide-react';

export const DashboardView = () => {
  const { purchases, expenditures } = useStore();

  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());

  // Filter today's purchases
  const datePurchases = purchases.filter((p) => p.dateTime?.startsWith(selectedDate));
  const dateExpenses = expenditures.filter((e) => e.dateTime?.startsWith(selectedDate));

  const totalPurAmt = datePurchases.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const totalExpAmt = dateExpenses.reduce((s, e) => s + e.amount, 0);

  const displayDateStr = new Date(selectedDate).toLocaleDateString('en-GB');

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Date Selector Row (Matching dashboard_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center space-x-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Date:
        </span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
        />
        <button
          onClick={() => {}}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Headline & Stats Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-1">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Dashboard - {displayDateStr}
        </h1>
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
          Purchases Inward: ₹{totalPurAmt.toFixed(2)} | Overheads: ₹{totalExpAmt.toFixed(2)}
        </div>
      </div>

      {/* Group 1: Today's Itemized Purchases (Matching dashboard_tab.py table_p) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Today's Itemized Purchases
        </h2>

        <div className="overflow-x-auto min-h-[160px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-36">Time</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4 w-36 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {datePurchases.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400">
                    No purchase inward recorded on this date.
                  </td>
                </tr>
              ) : (
                datePurchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {p.dateTime ? new Date(p.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.itemName} (x{p.quantity})
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{(p.quantity * p.costPrice).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group 2: Today's Expenses (Matching dashboard_tab.py table_e) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Today's Expenses
        </h2>

        <div className="overflow-x-auto min-h-[160px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 w-36 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dateExpenses.length === 0 ? (
                <tr>
                  <td colSpan="2" className="py-8 text-center text-slate-400">
                    No expenses recorded on this date.
                  </td>
                </tr>
              ) : (
                dateExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {e.description}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
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
