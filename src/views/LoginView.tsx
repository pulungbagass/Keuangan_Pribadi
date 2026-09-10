import React, { useState } from 'react';
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
} from 'lucide-react';
import { User as UserType } from '../types';
import { saveSession } from '../services/auth';
import {
  loginEmailUser,
  loginOrRegisterGoogleUser,
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

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Status & Feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setErrorMessage('Mohon isi email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginEmailUser(loginEmail, loginPassword);
      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Gagal masuk. Silakan periksa kembali akun Anda.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Berhasil masuk! Menyiapkan data keuangan Anda...');
      setTimeout(() => {
        completeLogin(result.user!);
      }, 500);
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat memproses login.');
      setIsLoading(false);
    }
  };

  // 2. Submit Email Registration
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

      setSuccessMessage('Pendaftaran berhasil! Akun Anda telah disimpan ke database.');
      setTimeout(() => {
        completeLogin(result.user!);
      }, 700);
    } catch (err) {
      setErrorMessage('Terjadi kendala saat menyimpan pendaftaran.');
      setIsLoading(false);
    }
  };

  // 3. Submit Google Sign-In / Sign-Up
  const handleGoogleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMessage('Mohon masukkan alamat email Google Anda.');
      return;
    }

    setIsLoading(true);
    setShowGoogleModal(false);

    setTimeout(() => {
      const name = googleName.trim() || googleEmail.split('@')[0];
      const result = loginOrRegisterGoogleUser({
        email: googleEmail.trim().toLowerCase(),
        name: name,
        image_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
      });

      setSuccessMessage(`Akun Google terhubung! Masuk sebagai ${result.user.name}...`);
      setTimeout(() => {
        completeLogin(result.user);
      }, 500);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative background ambient glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Logo */}
      <header className="pt-4 relative z-10">
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
            <p className="text-[11px] text-slate-400 font-medium">Personal Finance PWA</p>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="my-auto py-4 relative z-10 space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Database User Aktif & Terisolasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {activeTab === 'login' ? (
              <>
                Selamat Datang Kembali <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                  Akses Catatan Finansial Anda
                </span>
              </>
            ) : (
              <>
                Buat Akun Baru <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                  Mulai Rencanakan Keuangan
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
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
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
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
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

        {/* Google Authentication Button */}
        <button
          id="btn-google-auth"
          type="button"
          onClick={() => {
            clearFeedback();
            setShowGoogleModal(true);
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition shadow-lg shadow-black/20 active:scale-98 disabled:opacity-70 cursor-pointer"
        >
          {/* Official Google 4-Color Vector Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>
            {activeTab === 'login'
              ? 'Masuk dengan Akun Google'
              : 'Daftar dengan Akun Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            atau dengan email
          </span>
        </div>

        {/* TAB 1: FORM MASUK (LOGIN) */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
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
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Akun'}</span>
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                Belum memiliki akun?{' '}
                <span className="text-emerald-400 font-semibold underline underline-offset-2">
                  Daftar di sini
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
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}</span>
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
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
          <span>Setiap user terisolasi dengan data transaksi & kategori mandiri.</span>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="pt-3 border-t border-slate-800/80 text-center relative z-10">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Sesi JWT Otomatis Kedaluwarsa 2 Jam Demi Keamanan</span>
        </p>
      </footer>

      {/* Google Sign-In & Authentication Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white text-slate-900 p-6 shadow-2xl animate-in zoom-in-95 relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Logo Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <svg className="w-7 h-7 mx-auto mb-2" viewBox="0 0 24 24">
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
              <h3 className="font-bold text-base text-slate-800">
                {activeTab === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}
              </h3>
              <p className="text-xs text-slate-500">
                Akses langsung ke database Catatan Keuangan
              </p>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun Google Anda
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="contoh: pulungbagas036@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Masukkan email akun Google asli Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan Akun (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Nama Akun Google Anda"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                >
                  <span>Lanjutkan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
