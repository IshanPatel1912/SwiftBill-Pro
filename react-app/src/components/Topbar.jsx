import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sun,
  Moon,
  Laptop,
  Wifi,
  Printer,
  User,
  Clock,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export const Topbar = () => {
  const { theme, setTheme, businessDetails, resetToDemoData } = useStore();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Clock and Live Store Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 font-mono">
          <Clock className="w-3.5 h-3.5 text-brand-500" />
          <span>{timeStr}</span>
        </div>

        {/* Shortcuts helper */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-400 dark:text-slate-500">Shortcuts:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            Enter: Add
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            F1: Print
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            Del: Clear
          </span>
        </div>
      </div>

      {/* Right: Hardware Status, Theme Selector & User Profile */}
      <div className="flex items-center space-x-3">
        {/* WhatsApp Microservice Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
          <Smartphone className="w-3.5 h-3.5" />
          <span>WhatsApp Linked</span>
        </div>

        {/* Printer Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 px-2.5 py-1 rounded-lg">
          <Printer className="w-3.5 h-3.5" />
          <span>80mm POS</span>
        </div>

        {/* Reset Demo Data button */}
        <button
          onClick={resetToDemoData}
          title="Reset store data to sample initial catalog"
          className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px] font-medium">Reset Demo</span>
        </button>

        {/* Theme Selector */}
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
            title="System Theme"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Cashier Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800">
            AP
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Ishan Patel
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Admin (Counter 1)
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
