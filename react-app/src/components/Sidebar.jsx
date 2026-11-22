import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingCart,
  Tag,
  Truck,
  Receipt,
  Search,
  Boxes,
  LineChart,
  PieChart,
  Home,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    businessDetails,
    currentUser,
    logout
  } = useStore();

  const navItems = [
    { id: 'pos', label: 'POS / Sell', icon: ShoppingCart },
    { id: 'item', label: 'Items', icon: Tag },
    { id: 'purchase', label: 'Purchase', icon: Truck },
    { id: 'expense', label: 'Expenditure', icon: Receipt },
    { id: 'find_bill', label: 'Find Bill', icon: Search },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'customer', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none shrink-0 h-screen sticky top-0 transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div>
        {/* Header & Toggle Button */}
        <div className="h-16 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-2.5 overflow-hidden pl-1">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 font-bold shadow-sm">
                <Store className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                  {businessDetails.name || 'Convenience Store'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">POS System</div>
              </div>
            </div>
          )}

          {isSidebarCollapsed && (
            <div className="w-full flex justify-center">
              <button
                onClick={toggleSidebar}
                title="Expand Navigation (Get full labels)"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              title="Collapse Navigation (Get more screen space)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Navigation Items */}
        <div className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout Button */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="truncate">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">User:</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {currentUser ? currentUser.username : 'admin'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout from POS"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
