import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sun,
  Moon,
  Laptop,
  Printer,
  Smartphone,
  LogOut
} from 'lucide-react';

export const Topbar = () => {
  const {
    theme,
    setTheme,
    businessDetails,
    currentUser,
    logout
  } = useStore();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: App Title */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              🏪 Convenience Store POS & Inventory
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Retail Point of Sale • Thermal ESC/POS • WhatsApp Service • v2.0
          </p>
        </div>
      </div>

      {/* Right: Shortcut Pill, Theme Selector, User */}
      <div className="flex items-center space-x-3">
        {/* Shortcuts Hint Pill */}
        <div className="hidden xl:flex items-center px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          ⌨️ Shortcuts: F1 (POS) • F5 (Refresh) • Del (Remove) • Ctrl+S (Save)
        </div>

        {/* WhatsApp Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
          <Smartphone className="w-3.5 h-3.5" />
          <span>WhatsApp Linked</span>
        </div>

        {/* Theme Selector Dropdown */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md transition-all ${
              theme === 'light'
                ? 'bg-white text-amber-500 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Light Mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md transition-all ${
              theme === 'dark'
                ? 'bg-slate-700 text-sky-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Dark Mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md transition-all ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-brand-500 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="System Default (Auto)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User logout */}
        <button
          onClick={logout}
          title="Log out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
