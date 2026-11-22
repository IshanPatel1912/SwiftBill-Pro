import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  LineChart,
  Download,
  Info
} from 'lucide-react';

export const AnalyticsView = () => {
  const { sales, purchases, showToast } = useStore();

  const [hoveredItem, setHoveredItem] = useState(null);

  // Aggregate sales by item
  const salesMap = {};
  sales.forEach((s) => {
    if (s.isDeleted) return;
    s.items?.forEach((it) => {
      if (!salesMap[it.name]) {
        salesMap[it.name] = { name: it.name, soldQty: 0, soldAmt: 0 };
      }
      salesMap[it.name].soldQty += it.qty;
      salesMap[it.name].soldAmt += it.amount;
    });
  });

  // Calculate avg costs from purchases
  const costMap = {};
  purchases.forEach((p) => {
    if (!costMap[p.itemName]) {
      costMap[p.itemName] = { qty: 0, cost: 0 };
    }
    costMap[p.itemName].qty += p.quantity;
    costMap[p.itemName].cost += p.costPrice * p.quantity;
  });

  const chartData = Object.values(salesMap).map((it) => {
    const avgSell = it.soldQty > 0 ? it.soldAmt / it.soldQty : 0;
    const purInfo = costMap[it.name];
    const avgCost = purInfo && purInfo.qty > 0 ? purInfo.cost / purInfo.qty : avgSell * 0.75;
    const profitUnit = avgSell - avgCost;
    const totalCost = avgCost * it.soldQty;
    const totalProfit = it.soldAmt - totalCost;

    return {
      name: it.name,
      soldQty: it.soldQty,
      soldAmt: it.soldAmt,
      avgSell,
      avgCost,
      profitUnit,
      totalCost,
      totalProfit,
    };
  });

  const totalSalesAll = chartData.reduce((s, x) => s + x.soldAmt, 0);

  const colors = [
    '#FF3333', '#3366FF', '#FF33CC', '#33CC33',
    '#EAB308', '#06B6D4', '#F97316', '#A855F7',
    '#EC4899', '#10B981'
  ];

  const handleExportPdf = () => {
    window.print();
    showToast('Exporting analytics report...');
  };

  const activeStats = hoveredItem || (chartData.length > 0 ? chartData[0] : null);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Top Title & Export Button (Matching analytics_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Sales Analytics & Profit Overview
        </h1>

        <button
          onClick={handleExportPdf}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>📄 Export Analytics Report (PDF)</span>
        </button>
      </div>

      {/* Info Panel (Hover Stats matching analytics_tab.py QGridLayout) */}
      {activeStats && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Product Profit & Cost Analysis</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Product:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">
                {activeStats.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Sold Qty:</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {activeStats.soldQty} units
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Avg Sell Price:</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                ₹{activeStats.avgSell.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Avg Cost Price:</span>
              <span className="font-mono font-bold text-sm text-slate-500">
                ₹{activeStats.avgCost.toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Total Sales:</span>
              <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                ₹{activeStats.soldAmt.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Cost (Sold):</span>
              <span className="font-mono font-bold text-sm text-slate-500">
                ₹{activeStats.totalCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Profit / Unit:</span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                ₹{activeStats.profitUnit.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Profit:</span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                ₹{activeStats.totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Donut Chart View (Matching QChartView in analytics_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[350px] flex flex-col items-center justify-center">
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No sales data available to plot analytics. Complete sales in the POS tab to view the profit donut chart.
          </div>
        ) : (
          <div className="w-full flex flex-col md:flex-row items-center justify-around gap-6">
            {/* SVG Donut Visualizer */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return chartData.map((slice, i) => {
                    const percent = totalSalesAll > 0 ? (slice.soldAmt / totalSalesAll) * 100 : 0;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={colors[i % colors.length]}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="cursor-pointer transition-all hover:opacity-80"
                        onMouseEnter={() => setHoveredItem(slice)}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sales</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  ₹{totalSalesAll.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {chartData.map((slice, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredItem(slice)}
                  className="flex items-center space-x-2 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  ></span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {slice.name}
                  </span>
                  <span className="font-mono text-slate-500 ml-auto">
                    ₹{slice.soldAmt.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
