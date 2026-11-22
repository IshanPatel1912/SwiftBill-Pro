import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { PosView } from './views/PosView';
import { ItemsView } from './views/ItemsView';
import { InventoryView } from './views/InventoryView';
import { PurchasesView } from './views/PurchasesView';
import { ExpendituresView } from './views/ExpendituresView';
import { FindBillView } from './views/FindBillView';
import { AnalyticsView } from './views/AnalyticsView';
import { PortfolioView } from './views/PortfolioView';
import { CustomersView } from './views/CustomersView';
import { SettingsView } from './views/SettingsView';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

const MainLayout = () => {
  const { activeTab, toast } = useStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pos':
        return <PosView />;
      case 'items':
        return <ItemsView />;
      case 'inventory':
        return <InventoryView />;
      case 'purchase':
        return <PurchasesView />;
      case 'expenditure':
        return <ExpendituresView />;
      case 'find_bill':
        return <FindBillView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'customers':
        return <CustomersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* Photorealistic 80mm ESC/POS Thermal Receipt Modal */}
      <ThermalReceiptModal />

      {/* Floating Modern Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
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
