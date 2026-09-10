import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  User,
  Sparkles,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  X,
  Database,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { User as UserType } from '../types';
import { saveSession } from '../services/auth';
import {
  checkDatabaseHealth,
  DatabaseStatus,
  loginEmailUser,
  registerEmailUser,
} from '../services/storage';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Database status and Setup Guide Modal
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ status: 'loading' });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Status & Feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkDatabaseHealth().then((status) => {
      setDbStatus(status);
    });
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    clearFeedback();
  };

  const completeLogin = (user: UserType) => {
    // Save JWT session (120 minutes)
    saveSession(user, 120);
    setIsLoading(false);
    onLoginSuccess();
  };

  // 1. Submit Email Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Mohon isi alamat email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginEmailUser(loginEmail, loginPassword);
      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Email atau kata sandi tidak cocok.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Berhasil masuk! Menyiapkan catatan keuangan Anda...');
      setTimeout(() => {
        completeLogin(result.user!);
      }, 500);
    } catch (err) {
      setErrorMessage('Terjadi kendala saat menghubungkan ke database.');
      setIsLoading(false);
    }
  };

  // 2. Submit Email Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!regName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerEmailUser(regName, regEmail, regPassword);
      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Gagal mendaftar akun.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Pendaftaran berhasil! Akun Anda telah disimpan langsung ke database Neon.');
      setTimeout(() => {
        completeLogin(result.user!);
      }, 700);
    } catch (err) {
      setErrorMessage('Terjadi kendala saat menyimpan pendaftaran ke database.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative background ambient glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Logo */}
      <header className="pt-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <span className="font-black text-emerald-400 text-base">CK</span>
              </div>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                CATATAN KEUANGAN
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Pure Neon PostgreSQL Database</p>
            </div>
          </div>

          {/* <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 text-[11px] font-semibold transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Info Neon DB</span>
          </button> */}
        </div>

        {/* Database Connection Live Status Bar */}
        {/* <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                dbStatus.status === 'connected'
                  ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-500/30'
                  : 'bg-rose-400 ring-2 ring-rose-500/30'
              }`}
            />
            <span className="text-slate-200 font-medium">
              {dbStatus.status === 'connected'
                ? 'Database Neon: Terhubung (Online Live)'
                : 'Database Neon: DATABASE_URL Belum Diset'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 text-[10px] cursor-pointer"
          >
            Panduan
          </button>
        </div> */}
      </header>

      {/* Main Authentication Card */}
      <main className="my-auto py-4 relative z-10 space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Pure Online Neon PostgreSQL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {activeTab === 'login' ? (
              <>
                Selamat Datang Kembali <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                  Masuk ke Akun Anda
                </span>
              </>
            ) : (
              <>
                Daftar Akun Baru <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                  Tersimpan di Database Neon
                </span>
              </>
            )}
          </h2>
        </div>

        {/* Auth Mode Tabs: Masuk vs Daftar */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80">
          <button
            id="tab-login"
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar</span>
          </button>
        </div>

        {/* Feedback Alert Notifications */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* TAB 1: FORM MASUK (LOGIN) */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  id="input-login-email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="input-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'LOADING...' : 'Masuk ke Akun'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer"
              >
                Belum memiliki akun?{' '}
                <span className="text-emerald-400 font-semibold underline underline-offset-2">
                  Daftar akun baru
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: FORM DAFTAR (REGISTER) */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  placeholder="Contoh: Bagas Pulung"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ulangi Sandi
                </label>
                <div className="relative">
                  <input
                    id="input-reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Konfirmasi sandi"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Mendaftarkan ke Database...' : 'Daftar Akun Baru'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer"
              >
                Sudah punya akun terdaftar?{' '}
                <span className="text-emerald-400 font-semibold underline underline-offset-2">
                  Masuk di sini
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Security & System Info Note */}
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Data tersimpan langsung di tabel database Neon PostgreSQL.</span>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="pt-3 border-t border-slate-800/80 text-center relative z-10">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Sesi JWT Otomatis Kedaluwarsa 2 Jam Demi Keamanan</span>
        </p>
      </footer>

      {/* Guide Modal: Setup Neon Database */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 text-slate-100 p-6 shadow-2xl animate-in zoom-in-95 relative my-8">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  Koneksi Database Neon PostgreSQL
                </h3>
                <p className="text-[11px] text-slate-400">
                  Langkah mengaktifkan live database cloud online
                </p>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              {/* Langkah 1: Neon Database */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    Salin Connection String dari Neon
                  </span>
                  <a
                    href="https://console.neon.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>Buka Neon</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Agar setiap pendaftaran akun dan input transaksi langsung tercatat di Neon:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                  <li>Buka dashboard project Anda di <strong className="text-white">neon.tech</strong>.</li>
                  <li>Di halaman Dashboard, cari bagian <strong className="text-white">Connection Details</strong>.</li>
                  <li>Pilih opsi <strong className="text-white">Connection String</strong> (Pooled atau Direct).</li>
                  <li>Salin URL koneksi PostgreSQL tersebut.</li>
                </ol>

                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between gap-2">
                  <span className="truncate">DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require', 'db_url')}
                    className="shrink-0 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    {copiedText === 'db_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400/90 font-medium">
                  Tabel <code className="bg-slate-900 px-1 py-0.5 rounded">users</code>, <code className="bg-slate-900 px-1 py-0.5 rounded">transactions</code>, <code className="bg-slate-900 px-1 py-0.5 rounded">categories</code>, dan <code className="bg-slate-900 px-1 py-0.5 rounded">reminders</code> akan otomatis dibuat oleh server saat terhubung!
                </p>
              </div>

              {/* Langkah 2: Memasang di AI Studio / Vercel */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <span className="font-bold text-teal-400 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  Pasang DATABASE_URL di Environment / Secrets
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Di Google AI Studio Build:</strong> Buka menu <strong>Settings</strong> di panel atas &rarr; pilih <strong>Secrets / Environment Variables</strong> &rarr; Tambahkan variabel <code className="text-white font-mono bg-slate-900 px-1 rounded">DATABASE_URL</code> dengan value connection string Neon Anda.
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Di Hosting Lain (Vercel / Cloud Run):</strong> Masuk ke <strong>Environment Variables</strong> &rarr; Masukkan key <code className="text-white font-mono bg-slate-900 px-1 rounded">DATABASE_URL</code>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
