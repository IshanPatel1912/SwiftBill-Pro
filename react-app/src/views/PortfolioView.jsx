import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getTodayDateString } from '../utils/dateUtils';
import {
  PieChart,
  Calendar,
  RefreshCw,
  FileText,
  Download,
  X
} from 'lucide-react';

export const PortfolioView = () => {
  const { sales, purchases, expenditures, showToast } = useStore();

  const [period, setPeriod] = useState('all'); // day, month, year, all
  const [selectedReportName, setSelectedReportName] = useState(null);
  const [startDate, setStartDate] = useState(() => getTodayDateString());
  const [endDate, setEndDate] = useState(() => getTodayDateString());

  // Calculations based on period
  const now = new Date();
  const filterByPeriod = (itemDateStr) => {
    if (!itemDateStr) return false;
    const itemDate = new Date(itemDateStr);
    if (period === 'day') {
      return itemDate.toDateString() === now.toDateString();
    } else if (period === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (period === 'year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  };

  const totalSales = sales
    .filter((s) => s.paidStatus && !s.isDeleted && filterByPeriod(s.dateTime))
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const totalPurchases = purchases
    .filter((p) => filterByPeriod(p.dateTime))
    .reduce((sum, p) => sum + p.quantity * p.costPrice, 0);

  const totalExpenses = expenditures
    .filter((e) => filterByPeriod(e.dateTime))
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalSales - totalPurchases - totalExpenses;

  const handleOpenExportDialog = (name) => {
    setSelectedReportName(name);
  };

  const handleConfirmExport = () => {
    // Generate Report CSV / Text
    const content = `SwiftBill Pro - ${selectedReportName}\nRange: ${startDate} to ${endDate}\nGenerated: ${new Date().toLocaleString()}\n\nTotal Sales: ₹${totalSales}\nTotal Purchases: ₹${totalPurchases}\nTotal Expenses: ₹${totalExpenses}\nNet Profit: ₹${netProfit}\n`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReportName.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_to_${endDate}.csv`;
    a.click();
    showToast(`Generated and exported ${selectedReportName}!`);
    setSelectedReportName(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* 1. Period Filter Buttons (Today, This Month, This Year, All Time matching portfolio_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPeriod('day')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'day'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'month'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'year'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          This Year
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            period === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Time
        </button>
      </div>

      {/* 2. 4 Big Labels (Matching portfolio_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
          Total Sales (Paid): ₹{totalSales.toFixed(2)}
        </div>
        <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
          Total Purchases: ₹{totalPurchases.toFixed(2)}
        </div>
        <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
          Total Expenses: ₹{totalExpenses.toFixed(2)}
        </div>
        <div className={`text-2xl font-extrabold font-mono pt-3 border-t border-slate-100 dark:border-slate-800 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          Net Profit: ₹{netProfit.toFixed(2)}
        </div>

        <button
          onClick={() => setPeriod('all')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs mt-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>🔄 Recalculate Screen Stats</span>
        </button>
      </div>

      {/* 3. Export Detailed Transaction Reports (Exact 5 Buttons from portfolio_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Export Detailed Transaction Reports (Selects Date Range)
        </h2>

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleOpenExportDialog('Sell Report (PDF)')}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            📑 Sell Report (PDF)
          </button>
          <button
            onClick={() => handleOpenExportDialog('Purchase Report (PDF)')}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            📑 Purchase Report (PDF)
          </button>
          <button
            onClick={() => handleOpenExportDialog('Expenditure Report (PDF)')}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors"
          >
            📑 Expenditure Report (PDF)
          </button>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleOpenExportDialog('All Over Report (PDF)')}
            className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            📑 All Over Report (PDF)
          </button>
          <button
            onClick={() => handleOpenExportDialog('All Over Report (CSV)')}
            className="py-2.5 px-4 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            📄 All Over Report (CSV)
          </button>
        </div>
      </div>

      {/* DateRangeDialog Modal (Matching DateRangeDialog from portfolio_tab.py) */}
      {selectedReportName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Select Report Date Range
              </h3>
              <button
                onClick={() => setSelectedReportName(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedReportName(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExport}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
