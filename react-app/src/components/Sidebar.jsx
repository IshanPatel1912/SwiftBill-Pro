import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  Search,
  Boxes,
  BarChart3,
  PieChart,
  Users,
  Settings,
  Store,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, businessDetails, inventory } = useStore();

  const lowStockCount = inventory.filter((i) => i.stock <= i.reorderLevel).length;

  const navItems = [
    { id: 'pos', label: 'POS / Sell', icon: ShoppingCart, hotkey: 'F1', badge: null },
    { id: 'items', label: 'Items Catalog', icon: Package, hotkey: null, badge: null },
    { id: 'purchase', label: 'Purchase', icon: Truck, hotkey: null, badge: null },
    { id: 'expenditure', label: 'Expenditure', icon: Receipt, hotkey: null, badge: null },
    { id: 'find_bill', label: 'Find Bill', icon: Search, hotkey: null, badge: null },
    { id: 'inventory', label: 'Inventory', icon: Boxes, hotkey: null, badge: lowStockCount > 0 ? `${lowStockCount} Low` : null, badgeColor: 'bg-amber-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, hotkey: null, badge: null },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart, hotkey: null, badge: null },
    { id: 'customers', label: 'Customers', icon: Users, hotkey: null, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, hotkey: null, badge: null },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  SwiftBill
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px]" title={businessDetails.name}>
                {businessDetails.name}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Store Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.hotkey && (
                    <span className={`text-[10px] px-1 py-0.5 rounded font-mono ${isActive ? 'bg-brand-700 text-brand-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {item.hotkey}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status / Terminal Badge */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-750">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Terminal Ready</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v2.5</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Thermal ESC/POS & WhatsApp ready
          </p>
        </div>
      </div>
    </aside>
  );
};
