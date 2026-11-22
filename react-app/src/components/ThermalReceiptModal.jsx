import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, Smartphone, Download, X, CheckCircle2, QrCode } from 'lucide-react';

export const ThermalReceiptModal = () => {
  const { receiptModalSale, setReceiptModalSale, businessDetails, showToast } = useStore();
  const [whatsappSent, setWhatsappSent] = useState(false);

  if (!receiptModalSale) return null;

  const sale = receiptModalSale;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    setWhatsappSent(true);
    showToast(`Thermal invoice PDF sent via WhatsApp to ${sale.customerMobile || businessDetails.phone}`);
    setTimeout(() => setWhatsappSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="font-bold text-slate-800 dark:text-white text-xs">
              Thermal Receipt Preview ({businessDetails.thermalRollSize || '80mm'})
            </span>
          </div>
          <button
            onClick={() => setReceiptModalSale(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="thermal-receipt-print"
            className="w-[290px] bg-white text-black p-4 shadow-sm border border-slate-300 font-mono text-[11px] leading-tight"
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-sm tracking-wide">
                {(businessDetails.name || 'CONVENIENCE STORE').toUpperCase()}
              </div>
              <div className="text-[10px] text-gray-700 mt-0.5">{businessDetails.address}</div>
              <div className="text-[10px] mt-0.5 font-bold">Tel: {businessDetails.phone}</div>
            </div>

            {/* Bill Info */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>BILL: <b>{sale.billId}</b></span>
                <span>{sale.dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME: {sale.timeStr}</span>
                <span>PAY: {sale.paidStatus ? 'PAID' : 'DUE'}</span>
              </div>
              {sale.customerName && (
                <div className="pt-0.5">
                  <span>CUST: {sale.customerName} {sale.customerMobile ? `(${sale.customerMobile})` : ''}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-400">
                <span className="w-1/2">ITEM</span>
                <span className="w-10 text-center">QTY</span>
                <span className="w-12 text-right">RATE</span>
                <span className="w-14 text-right">TOTAL</span>
              </div>
              <div className="pt-1 space-y-1 text-[10px]">
                {sale.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="w-1/2 truncate">{it.name}</span>
                    <span className="w-10 text-center">{it.qty}</span>
                    <span className="w-12 text-right">{it.rate.toFixed(2)}</span>
                    <span className="w-14 text-right font-bold">{it.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 space-y-0.5 border-b border-dashed border-gray-400 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{sale.subtotal?.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-₹{sale.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
                <span>TOTAL AMOUNT:</span>
                <span>₹{sale.grandTotal?.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[9px] text-gray-700">
              <div>Thank You! Visit Again</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleWhatsApp}
            className={`flex-1 py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center space-x-1 ${
              whatsappSent ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {whatsappSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{whatsappSent ? 'Sent!' : 'WhatsApp'}</span>
          </button>
          <button
            onClick={() => setReceiptModalSale(null)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
