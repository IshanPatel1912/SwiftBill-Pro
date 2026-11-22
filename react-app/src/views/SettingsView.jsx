import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Settings,
  Printer,
  Smartphone,
  Users,
  Save,
  CheckCircle2,
  Trash2,
  LogOut,
  QrCode
} from 'lucide-react';

export const SettingsView = () => {
  const {
    businessDetails,
    setBusinessDetails,
    users,
    addUser,
    deleteUser,
    theme,
    setTheme,
    showToast
  } = useStore();

  const [bizName, setBizName] = useState(businessDetails.name || '');
  const [bizAddress, setBizAddress] = useState(businessDetails.address || '');
  const [bizPhone, setBizPhone] = useState(businessDetails.phone || '');
  const [bizOwner, setBizOwner] = useState(businessDetails.owner || '');
  const [printer, setPrinter] = useState(businessDetails.printer || 'Default Windows Printer');
  const [thermalRoll, setThermalRoll] = useState(businessDetails.thermalRollSize || '80mm (Standard POS)');

  // User Management
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // WhatsApp Messaging toggle
  const [waActive, setWaActive] = useState(businessDetails.whatsappEnabled !== false);

  const handleSaveBusiness = (e) => {
    e.preventDefault();
    setBusinessDetails({
      ...businessDetails,
      name: bizName.trim(),
      address: bizAddress.trim(),
      phone: bizPhone.trim(),
      owner: bizOwner.trim(),
      printer,
      thermalRollSize: thermalRoll,
      themeMode: theme,
      whatsappEnabled: waActive,
    });
    showToast('Business details saved successfully!');
  };

  const handleTestPrint = () => {
    showToast('Sent test print command to ESC/POS receipt printer spooler.');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      showToast('Enter Username and Password.', 'error');
      return;
    }
    addUser(newUsername.trim(), newPassword);
    setNewUsername('');
    setNewPassword('');
  };

  const handleDeleteUser = () => {
    if (!selectedUserId) {
      showToast('Select a user from the table to delete.', 'info');
      return;
    }
    deleteUser(selectedUserId);
    setSelectedUserId(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* 1. Business Details Group (Matching business_detail_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
          Business Details
        </h2>

        <form onSubmit={handleSaveBusiness} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Business Name:
            </label>
            <div className="sm:col-span-9">
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Address:
            </label>
            <div className="sm:col-span-9">
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Phone:
            </label>
            <div className="sm:col-span-9">
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Owner Name:
            </label>
            <div className="sm:col-span-9">
              <input
                type="text"
                value={bizOwner}
                onChange={(e) => setBizOwner(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Receipt Printer:
            </label>
            <div className="sm:col-span-9 flex items-center space-x-2">
              <select
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Default Windows Printer">Default Windows Printer</option>
                <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                <option value="POS-80 ESC/POS Thermal Printer">POS-80 ESC/POS Thermal Printer</option>
                <option value="No Printer (WhatsApp Only)">No Printer (WhatsApp Only)</option>
              </select>
              <button
                type="button"
                onClick={handleTestPrint}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                🖨️ Test Print
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Thermal Roll Size:
            </label>
            <div className="sm:col-span-9">
              <select
                value={thermalRoll}
                onChange={(e) => setThermalRoll(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="80mm (Standard POS)">80mm (Standard POS)</option>
                <option value="58mm (Compact Roll)">58mm (Compact Roll)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Theme Mode:
            </label>
            <div className="sm:col-span-9">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="system">💻 System Default (Auto)</option>
                <option value="light">☀️ Light Mode</option>
                <option value="dark">🌙 Dark Mode</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              💾 Save Business Details
            </button>
          </div>
        </form>
      </div>

      {/* 2. WhatsApp Integration Group (Matching business_detail_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
          WhatsApp Integration (Automatic PDF Invoice Sending)
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Messaging:
            </span>
            <button
              onClick={() => {
                setWaActive(!waActive);
                showToast(waActive ? 'WhatsApp messaging stopped' : 'WhatsApp messaging started');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-colors ${
                waActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {waActive ? 'Stop WhatsApp Messaging' : 'Start WhatsApp Messaging'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Device:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[11px] flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Connected (916351803513)</span>
            </span>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => showToast('Opening WhatsApp QR scanner...')}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
          >
            📱 Link WhatsApp / Scan QR
          </button>
          <button
            onClick={() => showToast('Session disconnected')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
          >
            🚪 Logout / Disconnect
          </button>
        </div>
      </div>

      {/* 3. User Management (Login Control) Group (Matching business_detail_tab.py) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
          User Management (Login Control)
        </h2>

        {/* User Form */}
        <form onSubmit={handleAddUser} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Username:
            </label>
            <div className="sm:col-span-9">
              <input
                type="text"
                required
                placeholder="Username (e.g. cashier1)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-3 font-semibold text-slate-600 dark:text-slate-300 sm:text-right">
              Password:
            </label>
            <div className="sm:col-span-9">
              <input
                type="password"
                required
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              Add User / Reset Password
            </button>
          </div>
        </form>

        {/* User Table (Columns: ID, Username matching business_detail_tab.py) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[140px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-20">ID</th>
                <th className="py-2.5 px-4">Username</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedUserId === u.id
                      ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {u.username}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
          >
            Delete Selected User
          </button>
        </div>
      </div>
    </div>
  );
};
