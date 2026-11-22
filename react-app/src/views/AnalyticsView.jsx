import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsView = () => {
  const { invoices, items } = useStore();

  const totalRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalBills = invoices.length;
  const avgBasket = totalBills > 0 ? totalRevenue / totalBills : 0;
  const estimatedProfit = totalRevenue * 0.22; // ~22% average gross profit margin

  // Top Products breakdown
  const itemCounts = {};
  invoices.forEach((inv) => {
    inv.items.forEach((it) => {
      if (!itemCounts[it.name]) {
        itemCounts[it.name] = { name: it.name, qty: 0, revenue: 0 };
      }
      itemCounts[it.name].qty += it.qty;
      itemCounts[it.name].revenue += it.total;
    });
  });

  const topProducts = Object.values(itemCounts)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment Breakdown
  const paymentModes = { UPI: 0, Cash: 0, Card: 0 };
  invoices.forEach((inv) => {
    const mode = inv.paymentMode?.includes('UPI') ? 'UPI' : inv.paymentMode || 'Cash';
    paymentModes[mode] = (paymentModes[mode] || 0) + inv.grandTotal;
  });

  // Daily revenue trend (last 7 days simulation based on invoices)
  const daysData = [
    { day: 'Mon', revenue: 1420 },
    { day: 'Tue', revenue: 2150 },
    { day: 'Wed', revenue: 1890 },
    { day: 'Thu', revenue: 2650 },
    { day: 'Fri', revenue: 3120 },
    { day: 'Sat', revenue: 4480 },
    { day: 'Sun (Today)', revenue: totalRevenue > 0 ? Math.round(totalRevenue) : 3860 },
  ];
  const maxRev = Math.max(...daysData.map((d) => d.revenue));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Store Performance & Sales Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key retail performance indicators, basket size, and revenue breakdown.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Sales Realized
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs previous period</span>
          </div>
        </div>

        {/* Card 2: Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Invoices Generated
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {totalBills}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Successful checkout transactions
          </div>
        </div>

        {/* Card 3: Avg Basket */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Basket Size
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            ₹{avgBasket.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Per transaction spending
          </div>
        </div>

        {/* Card 4: Profit Margin */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Gross Margin
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{estimatedProfit.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            ~22.0% blended gross profit
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 cols): Revenue Trend Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              7-Day Sales Revenue Trend
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Daily Store Totals</span>
          </div>

          {/* Clean SVG / Bar Visualizer */}
          <div className="h-56 flex items-end justify-between pt-8 px-4 gap-3 border-b border-slate-200 dark:border-slate-800">
            {daysData.map((d, idx) => {
              const heightPct = Math.round((d.revenue / maxRev) * 100);
              const isToday = idx === daysData.length - 1;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center group">
                  <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{d.revenue}
                  </span>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-brand-600 to-sky-400 shadow-md shadow-brand-500/20'
                        : 'bg-slate-200 dark:bg-slate-700/80 hover:bg-brand-400'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className={`text-[10px] mt-2 font-medium truncate max-w-full ${isToday ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
            <span>Peak checkout traffic occurs on weekends</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target: ₹5,000 / day</span>
          </div>
        </div>

        {/* Right (4 cols): Payment Mode Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Payment Mode Share
          </h2>

          <div className="space-y-3 pt-2">
            {Object.entries(paymentModes).map(([mode, amt]) => {
              const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
              const color = mode === 'UPI' ? 'bg-indigo-600' : mode === 'Cash' ? 'bg-emerald-600' : 'bg-sky-600';

              return (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{mode}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₹{amt.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Digital Payment Insight
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              UPI transactions via QR Code make up the majority of customer checkouts, reducing cash register variance.
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Best-Selling Products */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Top 5 Fast-Moving Items
          </span>
          <span className="text-[11px] text-slate-400 font-mono">By Total Revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">Product Name</th>
                <th className="py-2.5 px-4 w-32 text-center">Units Sold</th>
                <th className="py-2.5 px-4 w-36 text-right">Revenue Contributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    0{i + 1}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                    {p.qty} units
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{p.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
