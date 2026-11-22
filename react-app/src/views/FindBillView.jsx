import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search,
  Printer,
  Smartphone,
  FileText,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

export const FindBillView = () => {
  const { invoices, setReceiptModalInvoice, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (inv.customerMobile && inv.customerMobile.includes(search));
    const matchDate = dateFilter ? inv.date === dateFilter : true;
    const matchStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
    return matchSearch && matchDate && matchStatus;
  });

  const handleWhatsApp = (inv) => {
    showToast(`Thermal invoice PDF sent via WhatsApp to ${inv.customerMobile || 'customer'}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Search className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Search & Manage Invoices</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
              {invoices.length} Bills
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lookup past sales invoices, reprint thermal receipts, and dispatch WhatsApp PDFs.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill #, customer name, or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>

        {/* Date Filter */}
        <div className="md:col-span-4 flex items-center space-x-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Clear date filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 flex space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {['All', 'PAID', 'DUE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-28">Invoice No</th>
                <th className="py-3 px-4 w-28">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4 w-24 text-center">Items</th>
                <th className="py-3 px-4 w-28 text-right">Grand Total</th>
                <th className="py-3 px-4 w-28 text-center">Payment Mode</th>
                <th className="py-3 px-4 w-20 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-700 dark:text-slate-300">{inv.date}</div>
                    <div className="text-[10px] text-slate-400">{inv.time}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {inv.customerName || 'Walk-in Customer'}
                    </div>
                    {inv.customerMobile && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        +91 {inv.customerMobile}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{inv.grandTotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {inv.paymentMode || 'Cash'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Print 80mm */}
                      <button
                        onClick={() => setReceiptModalInvoice(inv)}
                        className="p-1.5 text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Print 80mm Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => handleWhatsApp(inv)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Send PDF to WhatsApp"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>

                      {/* View Details */}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Detailed Bill Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Drawer / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Invoice: {selectedInvoice.invoiceNo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-semibold">
                    {selectedInvoice.status}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedInvoice.date} at {selectedInvoice.time} • Billed by {selectedInvoice.cashier || 'admin'}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedInvoice.customerName || 'Walk-in'}
                  </span>
                  {selectedInvoice.customerMobile && (
                    <span className="text-slate-500 font-mono block text-[11px]">
                      +91 {selectedInvoice.customerMobile}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Mode:</span>
                  <span className="font-semibold text-slate-900 dark:text-white uppercase">
                    {selectedInvoice.paymentMode}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedInvoice.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {it.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{it.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{it.rate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{it.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{selectedInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax:</span>
                    <span className="font-mono">+₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Grand Total:</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">
                    ₹{selectedInvoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setReceiptModalInvoice(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-sm hover:bg-brand-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Thermal View</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
