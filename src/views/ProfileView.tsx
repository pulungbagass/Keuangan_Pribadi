import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Clock,
  Database,
  RefreshCw,
  LogOut,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { AuthSession, Category, Reminder, Transaction, User } from '../types';
import { extendSession } from '../services/auth';
import {
  checkDatabaseHealth,
  DatabaseStatus,
  exportTransactionsToCSV,
  initializeUserDatabase,
  resetUserDataOnServer,
  syncUserDataWithServer,
} from '../services/storage';

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
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ status: 'loading' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    checkDatabaseHealth().then(setDbStatus);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await syncUserDataWithServer(session.user.id);
      onReloadData();
      if (res.synced) {
        setSyncSuccessMsg('Data berhasil disingkronkan dengan server Neon PostgreSQL!');
      } else {
        setSyncSuccessMsg('Singkronisasi selesai (mode lokal aktif).');
      }
    } catch (e) {
      setSyncSuccessMsg('Gagal melakukan singkronisasi.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    }
  };

  const handleExtendSession = () => {
    const updated = extendSession(120);
    if (updated) {
      onSessionUpdated(updated);
      setExtendedMsg(true);
      setTimeout(() => setExtendedMsg(false), 3000);
    }
  };

  const handleResetData = async () => {
    // Clear transactions & reminders for user
    try {
      await resetUserDataOnServer(session.user.id);
      localStorage.removeItem('ck_db_transactions');
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
    <div className="app-page space-y-4">
      {/* Title */}
      <div>
        <h2 className="section-title">
          Akun & Keamanan
        </h2>
        <p className="section-subtitle">
          Status sesi JWT dan sinkronisasi database Neon PostgreSQL
        </p>
      </div>

      {/* User Card */}
      <div className="card p-4 flex items-center gap-3.5">
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
              Database Neon PostgreSQL
            </span>
          </div>
        </div>
      </div>

      {/* JWT Security Session Card */}
      <div className="card p-4 space-y-3">
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
          className="btn-secondary w-full py-2.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Perpanjang Sesi (+2 Jam)</span>
        </button>
      </div>

      {/* Neon PostgreSQL Live Database Card */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">Database Neon PostgreSQL</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.status === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-600">
              {dbStatus.status === 'connected' ? 'Aktif & Terhubung' : 'Mode Offline'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          {dbStatus.status === 'connected'
            ? 'Setiap transaksi baru dan login otomatis tersimpan di tabel cloud database Neon PostgreSQL.'
            : 'Server saat ini menyimpan ke storage lokal perangkat. Pasang DATABASE_URL di Environment Variables (Vercel) untuk mengaktifkan live database Neon.'}
        </p>

        {syncSuccessMsg && (
          <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-100 animate-in fade-in flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </p>
        )}

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition disabled:opacity-60 active:scale-98"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan ke Neon...' : 'Singkronkan Data Sekarang'}</span>
        </button>
      </div>

      {/* Database Statistics */}
      <div className="card p-4 space-y-3">
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
          className="btn-secondary w-full py-2.5 text-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cadangkan Data ke CSV / Excel</span>
        </button>
      </div>

      {/* Reset & Logout */}
      <div className="space-y-2 pt-2">
        {resetConfirm ? (
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 animate-in fade-in">
            <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Hapus dan kosongkan semua data transaksi & pengingat?</span>
            </p>
            <p className="text-[11px] text-rose-600">
              Seluruh riwayat transaksi dan tagihan akan dikosongkan (clear). Tindakan ini tidak dapat dibatalkan.
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
                Ya, Kosongkan Semua
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-rose-600 hover:text-rose-700 text-xs font-semibold transition"
          >
            Kosongkan Semua Data Transaksi & Tagihan
          </button>
        )}

        <button
          onClick={onLogout}
          id="btn-logout-full"
          className="btn-danger-ghost w-full py-3 bg-rose-50 hover:bg-rose-100 border-rose-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>
    </div>
  );
};
