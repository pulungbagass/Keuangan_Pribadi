import React, { useState, useEffect } from 'react';
import { LogOut, Clock, ShieldCheck, RefreshCw, Database } from 'lucide-react';
import { AuthSession } from '../../types';
import { extendSession } from '../../services/auth';

interface TopBarProps {
  session: AuthSession;
  onLogout: () => void;
  onSessionUpdated: (session: AuthSession) => void;
  onOpenProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  session,
  onLogout,
  onSessionUpdated,
  onOpenProfile,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isNearExpiry, setIsNearExpiry] = useState<boolean>(false);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const remainingMs = session.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setTimeLeftStr('00:00');
        onLogout();
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      if (hours > 0) {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeftStr(`${pad(minutes)}:${pad(seconds)}`);
      }

      // If less than 10 minutes remaining
      setIsNearExpiry(remainingMs < 10 * 60 * 1000);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session.expiresAt, onLogout]);

  const handleExtend = () => {
    const updated = extendSession(120);
    if (updated) {
      onSessionUpdated(updated);
      setShowSessionModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-2.5 transition-all">
        <div className="max-w-md md:max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* User profile avatar & greeting */}
          <button
            id="btn-topbar-profile"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 text-left group hover:opacity-90 transition active:scale-98"
          >
            <div className="relative">
              <img
                src={session.user.image_url}
                alt={session.user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition shadow-xs"
                onError={(e) => {
                  // Fallback to stylized initial
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                CATATAN KEUANGAN
              </p>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <span className="truncate max-w-[110px]">{session.user.name}</span>
                <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              </h2>
            </div>
          </button>

          {/* Right Action Tools: Session & Database */}
          <div className="flex items-center gap-2">
            {/* Neon DB Online status */}
            {/* <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100"
              title="Terhubung ke Database Neon PostgreSQL"
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Neon Online</span>
            </div> */}

            {/* Session Countdown Badge */}
            <button
              id="btn-session-timer"
              onClick={() => setShowSessionModal(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                isNearExpiry
                  ? 'bg-amber-100 text-amber-800 animate-pulse ring-1 ring-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Status Sesi Login (Klik untuk perpanjang)"
            >
              <Clock className={`w-3 h-3 ${isNearExpiry ? 'text-amber-600' : 'text-slate-500'}`} />
              <span className="font-mono text-[11px]">{timeLeftStr || '2:00:00'}</span>
            </button>

            {/* Quick Logout */}
            <button
              id="btn-quick-logout"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sesi Keamanan JWT</h3>
                <p className="text-xs text-slate-500">Auto-Logout Berbasis Token</p>
              </div>
            </div>

            <div className="my-4 space-y-2 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengguna:</span>
                  <span className="text-slate-800 font-semibold">{session.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sisa Waktu Sesi:</span>
                  <span className="text-emerald-700 font-bold">{timeLeftStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proteksi:</span>
                  <span className="text-slate-700">Auto Logout jika idle</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Sesuai standar keamanan aplikasi Catatan Keuangan, sesi aktif memiliki masa berlaku (maxAge). Jika habis, Anda akan otomatis dialihkan ke halaman masuk.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Tutup
              </button>
              <button
                onClick={handleExtend}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Perpanjang (+2 Jam)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
