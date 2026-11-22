import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, Smartphone, Download, X, CheckCircle2, QrCode } from 'lucide-react';

export const ThermalReceiptModal = () => {
  const { receiptModalInvoice, setReceiptModalInvoice, businessDetails, showToast } = useStore();
  const [whatsappSent, setWhatsappSent] = useState(false);

  if (!receiptModalInvoice) return null;

  const inv = receiptModalInvoice;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    setWhatsappSent(true);
    showToast(`Thermal invoice PDF dispatched to WhatsApp: +91 ${inv.customerMobile || businessDetails.phone}`);
    setTimeout(() => setWhatsappSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              Thermal Receipt Preview (80mm)
            </span>
          </div>
          <button
            onClick={() => setReceiptModalInvoice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950/70 flex justify-center">
          {/* Authentic 80mm ESC/POS Thermal Paper Container */}
          <div
            id="thermal-receipt-print"
            className="w-[320px] bg-white text-black p-5 shadow-md border border-slate-300 font-mono text-xs leading-relaxed"
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-base tracking-wider">{businessDetails.name.toUpperCase()}</div>
              <div className="text-[10px] mt-0.5">{businessDetails.tagline}</div>
              <div className="text-[10px] text-gray-700 mt-1">{businessDetails.address}</div>
              <div className="text-[10px] text-gray-700">{businessDetails.city}</div>
              <div className="text-[10px] mt-0.5 font-bold">Tel: {businessDetails.phone}</div>
              {businessDetails.gstin && (
                <div className="text-[10px] font-bold mt-0.5">GSTIN: {businessDetails.gstin}</div>
              )}
            </div>

            {/* Meta details */}
            <div className="py-2 text-[11px] border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE: <b>{inv.invoiceNo}</b></span>
                <span>{inv.date}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME: {inv.time || '12:00 PM'}</span>
                <span>CASHIER: {inv.cashier || 'admin'}</span>
              </div>
              {inv.customerName && (
                <div className="pt-0.5 border-t border-dotted border-gray-300">
                  <span>CUST: {inv.customerName} ({inv.customerMobile || 'N/A'})</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-400">
                <span className="w-1/2">ITEM</span>
                <span className="w-12 text-center">QTY</span>
                <span className="w-14 text-right">RATE</span>
                <span className="w-16 text-right">TOTAL</span>
              </div>
              <div className="pt-1.5 space-y-1.5 text-[11px]">
                {inv.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="w-1/2 leading-tight">{it.name}</span>
                    <span className="w-12 text-center">{it.qty}</span>
                    <span className="w-14 text-right">{it.rate.toFixed(2)}</span>
                    <span className="w-16 text-right font-semibold">{it.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="py-2 text-[11px] space-y-1 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Subtotal ({inv.items.reduce((s, x) => s + x.qty, 0)} items):</span>
                <span>₹{inv.subtotal.toFixed(2)}</span>
              </div>
              {inv.discount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span>-₹{inv.discount.toFixed(2)}</span>
                </div>
              )}
              {inv.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>GST / Tax:</span>
                  <span>+₹{inv.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
                <span>TOTAL AMOUNT:</span>
                <span>₹{inv.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{inv.paymentMode || 'Cash'}</span>
              </div>
            </div>

            {/* UPI QR & Barcode Simulation */}
            <div className="py-3 text-center flex flex-col items-center justify-center">
              <div className="border-2 border-black p-1 bg-white inline-block">
                <QrCode className="w-14 h-14" />
              </div>
              <div className="text-[9px] mt-1 text-gray-600">Scan UPI QR to verify digital receipt</div>
              {/* Barcode bars */}
              <div className="mt-2.5 flex items-center justify-center space-x-0.5 h-6">
                {[4, 2, 5, 2, 6, 3, 2, 5, 4, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 3, 5, 2].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w * 0.7}px` }}></div>
                ))}
              </div>
              <div className="text-[9px] tracking-widest mt-0.5">{inv.invoiceNo}</div>
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-1 text-[9px] text-gray-700 border-t border-dashed border-gray-400 leading-tight">
              <div>{businessDetails.footerNote}</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm (Ctrl+P)</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs transition-colors shadow-sm ${
                whatsappSent ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {whatsappSent ? <CheckCircle2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              <span>{whatsappSent ? 'Dispatched!' : 'Send WhatsApp'}</span>
            </button>
          </div>
          <button
            onClick={() => setReceiptModalInvoice(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
