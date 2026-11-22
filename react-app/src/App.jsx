import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginView } from './views/LoginView';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { PosView } from './views/PosView';
import { ItemsView } from './views/ItemsView';
import { PurchasesView } from './views/PurchasesView';
import { ExpendituresView } from './views/ExpendituresView';
import { FindBillView } from './views/FindBillView';
import { InventoryView } from './views/InventoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { PortfolioView } from './views/PortfolioView';
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { SettingsView } from './views/SettingsView';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const MainLayout = () => {
  const { currentUser, activeTab, toast } = useStore();

  // If user is not logged in, show Login Screen (Matching LoginDialog in main.py)
  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pos':
        return <PosView />;
      case 'item':
        return <ItemsView />;
      case 'purchase':
        return <PurchasesView />;
      case 'expense':
        return <ExpendituresView />;
      case 'find_bill':
        return <FindBillView />;
      case 'inventory':
        return <InventoryView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'dashboard':
        return <DashboardView />;
      case 'customer':
        return <CustomersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Collapsible Navigation Sidebar (Allows maximizing screen space) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* 80mm ESC/POS Thermal Receipt Modal */}
      <ThermalReceiptModal />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
