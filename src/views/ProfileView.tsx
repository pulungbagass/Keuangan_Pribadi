import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Clock,
  Database,
  RefreshCw,
  LogOut,
  Smartphone,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { AuthSession, Category, Reminder, Transaction, User } from '../types';
import { extendSession } from '../services/auth';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { exportTransactionsToCSV, initializeUserDatabase } from '../services/storage';

interface ProfileViewProps {
  session: AuthSession;
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  onLogout: () => void;
  onSessionUpdated: (updated: AuthSession) => void;
  onReloadData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  transactions,
  categories,
  reminders,
  onLogout,
  onSessionUpdated,
  onReloadData,
}) => {
  const [extendedMsg, setExtendedMsg] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleExtendSession = () => {
    const updated = extendSession(120);
    if (updated) {
      onSessionUpdated(updated);
      setExtendedMsg(true);
      setTimeout(() => setExtendedMsg(false), 3000);
    }
  };

  const handleResetData = () => {
    // Clear transactions & reminders for user, then re-seed
    try {
      localStorage.removeItem('ck_db_transactions');
      localStorage.removeItem('ck_db_categories');
      localStorage.removeItem('ck_db_reminders');
      initializeUserDatabase(session.user);
      onReloadData();
      setResetConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportAll = () => {
    const map: Record<string, string> = {};
    categories.forEach(c => (map[c.id] = c.name));
    exportTransactionsToCSV(transactions, map, `backup_keuangan_${session.user.name}.csv`);
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">
          Akun & Keamanan
        </h2>
        <p className="text-xs text-slate-400">
          Status sesi JWT dan penyimpanan lokal PWA
        </p>
      </div>

      {/* User Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5">
        <img
          src={session.user.image_url}
          alt={session.user.name}
          referrerPolicy="no-referrer"
          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {session.user.name}
            </h3>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{session.user.email}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Akun Google Terhubung
            </span>
          </div>
        </div>
      </div>

      {/* JWT Security Session Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-800">Sesi Keamanan JWT & Auto-Logout</h3>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Status Token:</span>
            <span className="font-mono text-emerald-700 font-bold">Aktif & Terverifikasi</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Durasi Sesi Aktif:</span>
            <span className="font-mono text-slate-800 font-semibold">{session.maxAgeMinutes} Menit</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Metode Pengamanan:</span>
            <span className="text-slate-800">Auto-Logout saat expired</span>
          </div>
        </div>

        {extendedMsg && (
          <p className="text-xs text-emerald-700 font-bold animate-in fade-in flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sesi berhasil diperpanjang 2 jam ke depan!</span>
          </p>
        )}

        <button
          onClick={handleExtendSession}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Perpanjang Sesi (+2 Jam)</span>
        </button>
      </div>

      {/* Database Statistics */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-800">Ringkasan Data Tersimpan</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-base font-black text-slate-800 block">
              {transactions.length}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Transaksi</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-base font-black text-slate-800 block">
              {categories.length}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Kategori</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-base font-black text-slate-800 block">
              {reminders.length}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Pengingat</span>
          </div>
        </div>

        <button
          onClick={handleExportAll}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cadangkan Data ke CSV / Excel</span>
        </button>
      </div>

      {/* PWA Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-800">Progressive Web App (PWA)</h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Aplikasi ini dirancang mobile-first dan dapat dipasang di layar utama ponsel Anda tanpa address bar browser.
        </p>
        <div className="pt-1">
          <PWAInstallButton />
        </div>
      </div>

      {/* Reset & Logout */}
      <div className="space-y-2 pt-2">
        {resetConfirm ? (
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 animate-in fade-in">
            <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Reset data ke contoh bawaan?</span>
            </p>
            <p className="text-[11px] text-rose-600">
              Transaksi yang Anda buat akan digantikan dengan data contoh awal.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
          >
            Reset Contoh Data Awal
          </button>
        )}

        <button
          onClick={onLogout}
          id="btn-logout-full"
          className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>
    </div>
  );
};
