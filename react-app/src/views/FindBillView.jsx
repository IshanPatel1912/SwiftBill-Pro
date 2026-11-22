import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search,
  Printer,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Edit,
  X
} from 'lucide-react';

export const FindBillView = () => {
  const { sales, deleteSale, restoreSale, setReceiptModalSale, showToast } = useStore();

  const [searchBy, setSearchBy] = useState('Bill ID');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(null);

  const filteredSales = sales.filter((s) => {
    // Recycle Bin filter
    const inRecycle = s.isDeleted === true;
    if (showRecycleBin !== inRecycle) return false;

    // Status filter
    if (statusFilter === 'Paid' && !s.paidStatus) return false;
    if (statusFilter === 'Unpaid' && s.paidStatus) return false;

    // Date filter
    if (dateFilter && !s.dateTime?.startsWith(dateFilter)) return false;

    // Search By
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    if (searchBy === 'Bill ID') {
      return s.billId?.toLowerCase().includes(term);
    } else if (searchBy === 'Customer Name') {
      return s.customerName?.toLowerCase().includes(term);
    } else if (searchBy === 'Mobile Number') {
      return s.customerMobile?.includes(term);
    } else if (searchBy === 'Product Name') {
      return s.items?.some((it) => it.name?.toLowerCase().includes(term));
    }
    return true;
  });

  const getSelectedBill = () => {
    return sales.find((s) => s.billId === selectedBillId);
  };

  const handlePrintThermal = () => {
    const bill = getSelectedBill();
    if (!bill) {
      showToast('Please select a bill from the table first.', 'info');
      return;
    }
    setReceiptModalSale(bill);
  };

  const handlePrintA4 = () => {
    const bill = getSelectedBill();
    if (!bill) {
      showToast('Please select a bill from the table first.', 'info');
      return;
    }
    window.print();
  };

  const handleSavePdf = () => {
    const bill = getSelectedBill();
    if (!bill) {
      showToast('Please select a bill from the table first.', 'info');
      return;
    }
    // PDF download simulation
    const content = `Invoice #${bill.billId}\nCustomer: ${bill.customerName}\nTotal: ₹${bill.grandTotal}\nStatus: ${bill.paidStatus ? 'PAID' : 'DUE'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.billId}.txt`;
    a.click();
    showToast(`PDF invoice generated for ${bill.billId}`);
  };

  const handleDelete = () => {
    if (!selectedBillId) {
      showToast('Please select a bill to delete.', 'info');
      return;
    }
    deleteSale(selectedBillId);
    setSelectedBillId(null);
  };

  const handleRestore = () => {
    if (!selectedBillId) {
      showToast('Please select a bill to restore.', 'info');
      return;
    }
    restoreSale(selectedBillId);
    setSelectedBillId(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* 1. Search Controls (Matching find_bill_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Search By:</span>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Bill ID">Bill ID</option>
              <option value="Customer Name">Customer Name</option>
              <option value="Product Name">Product Name</option>
              <option value="Mobile Number">Mobile Number</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All Status">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={() => {}}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Search
            </button>
          </div>
        </div>

        {/* Date Filter & Show Recycle Bin (Matching find_bill_tab.py) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Date Filter:
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400"
              >
                Clear Date Filter
              </button>
            )}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-rose-600 dark:text-rose-400">
            <input
              type="checkbox"
              checked={showRecycleBin}
              onChange={(e) => setShowRecycleBin(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600"
            />
            <span>🗑️ Show Recycle Bin</span>
          </label>
        </div>
      </div>

      {/* 2. Table: ["Bill ID", "Date", "Customer", "Total", "Status"] (Exact 5 columns) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[320px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-32">Bill ID</th>
                <th className="py-2.5 px-4 w-36">Date</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 w-32 text-right">Total (₹)</th>
                <th className="py-2.5 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No bills found. Complete sales in the POS / Sell tab to see invoices here.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr
                    key={s.billId}
                    onClick={() => setSelectedBillId(s.billId)}
                    className={`cursor-pointer transition-colors ${
                      selectedBillId === s.billId
                        ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {s.billId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.dateStr} {s.timeStr}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.customerName} {s.customerMobile ? `(${s.customerMobile})` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{s.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.paidStatus
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {s.paidStatus ? 'PAID' : 'UNPAID'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Action Buttons (Exact buttons from find_bill_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={handlePrintThermal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>🧾 Print Thermal Receipt</span>
        </button>

        <button
          onClick={handlePrintA4}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>🖨️ Print Invoice (A4)</span>
        </button>

        <button
          onClick={handleSavePdf}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>💾 Save PDF As...</span>
        </button>

        {!showRecycleBin ? (
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>🗑️ Delete Selected</span>
          </button>
        ) : (
          <button
            onClick={handleRestore}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>♻️ Restore Selected</span>
          </button>
        )}
      </div>
    </div>
  );
};
