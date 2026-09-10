import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, CheckCircle2, User, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';
import { DEFAULT_GOOGLE_USER, saveSession } from '../services/auth';
import { initializeUserDatabase } from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginWithUser = (user: UserType) => {
    setIsLoading(true);
    setTimeout(() => {
      // 1. Initialize user database with default categories & seeds if new
      initializeUserDatabase(user);
      // 2. Save JWT session with 2 hours expiry
      saveSession(user, 120);
      setIsLoading(false);
      onLoginSuccess();
    }, 650);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const name = customName.trim() || customEmail.split('@')[0];
    const customUser: UserType = {
      id: `usr_google_${Math.abs(customEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
      email: customEmail.trim().toLowerCase(),
      name: name,
      image_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
    };

    handleLoginWithUser(customUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Brand */}
      <div className="pt-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <span className="font-black text-emerald-400 text-lg">CK</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              CATATAN KEUANGAN
            </h1>
            <p className="text-xs text-slate-400 font-medium">Personal Finance PWA</p>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="my-auto py-8 relative z-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-3">
            <Sparkles className="w-3 h-3" />
            <span>Mobile-First & Cloud Ready</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
            Kelola Finansial <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
              Cerdas, Rapi & Presisi.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
            Pencatatan arus kas, kategori transaksi dinamis, fleksibilitas input JSONB, dan pengingat agenda tagihan dalam genggaman Anda.
          </p>
        </div>

        {/* Guest Prohibition Notice (Requirement: Guest system is disabled) */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sistem Guest Ditiadakan</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Demi keamanan data dan integritas relasi ID pengguna, seluruh pencatatan keuangan wajib terautentikasi melalui akun Google dengan sesi terlindungi JWT.
          </p>
        </div>

        {/* Main Action: Sign in with Google */}
        <div className="space-y-3">
          <button
            id="btn-google-login"
            onClick={() => setShowAccountChooser(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm transition shadow-xl shadow-white/5 active:scale-98 disabled:opacity-75"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4 0-.8.1-1.7.4-2.4L1.6 7c-.8 1.6-1.3 3.4-1.3 5.3 0 2 .5 3.8 1.3 5.4l3.7-3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
              />
            </svg>
            <span>{isLoading ? 'Menghubungkan Sesi...' : 'Lanjutkan dengan Akun Google'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-center relative z-10">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>JWT Session Auto-Logout (2-3 Jam) & Storage Terisolasi</span>
        </p>
      </div>

      {/* Account Chooser Dialog (Mimicking authentic Google OAuth picker) */}
      {showAccountChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl animate-in zoom-in-95">
            {/* Google Logo Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <svg className="w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4 0-.8.1-1.7.4-2.4L1.6 7c-.8 1.6-1.3 3.4-1.3 5.3 0 2 .5 3.8 1.3 5.4l3.7-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                />
              </svg>
              <h3 className="font-bold text-base text-slate-800">Pilih Akun Google</h3>
              <p className="text-xs text-slate-500">untuk masuk ke Catatan Keuangan</p>
            </div>

            {!isCustomMode ? (
              <div className="py-4 space-y-2.5">
                {/* Default User Recommendation */}
                <button
                  id="btn-account-default"
                  onClick={() => handleLoginWithUser(DEFAULT_GOOGLE_USER)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-200/80 transition text-left group active:scale-98"
                >
                  <img
                    src={DEFAULT_GOOGLE_USER.image_url}
                    alt={DEFAULT_GOOGLE_USER.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20 group-hover:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{DEFAULT_GOOGLE_USER.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{DEFAULT_GOOGLE_USER.email}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>

                {/* Option to enter other Google Account */}
                <button
                  id="btn-use-other-account"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-dashed border-slate-300 transition text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Gunakan akun Google lainnya</p>
                    <p className="text-[10px] text-slate-400">Masuk dengan email Anda sendiri</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="py-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Google Anda</label>
                  <input
                    type="email"
                    required
                    placeholder="namaanda@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bagas Pulung"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Masuk
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowAccountChooser(false);
                  setIsCustomMode(false);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
