import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  X,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export const CustomersView = () => {
  const { customers, setActiveTab } = useStore();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalCustomerSpend = customers.reduce((sum, c) => sum + c.totalSpend, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Customer Directory & Loyalty Profiles</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
              {customers.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer purchase frequency, lifetime value, and quick contact details.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* KPI & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Customer Lifetime Spend
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
              ₹{totalCustomerSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
            {customers.length}
          </div>
        </div>

        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or mobile number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 w-36">Mobile Number</th>
                <th className="py-3 px-4">Address / Area</th>
                <th className="py-3 px-4 w-24 text-center">Total Visits</th>
                <th className="py-3 px-4 w-32 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 w-28 text-center">Last Visit</th>
                <th className="py-3 px-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                    {i + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    +91 {c.phone}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                    {c.address || 'Ahmedabad'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {c.totalBills}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    ₹{c.totalSpend.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {c.lastVisit || '2026-11-22'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setActiveTab('pos')}
                      className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:hover:bg-brand-900 dark:text-brand-300 font-semibold text-[11px] transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Bill Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
