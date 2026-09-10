import React, { useState, useEffect } from 'react';
import { WifiOff, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { checkDatabaseHealth, DatabaseStatus } from '../../services/storage';

export const OnlineDatabaseStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ status: 'loading' });
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const verifyHealth = async () => {
    setIsChecking(true);
    const res = await checkDatabaseHealth();
    setDbStatus(res);
    setIsChecking(false);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      verifyHealth();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    verifyHealth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="font-semibold">
            Koneksi Internet Terputus (Offline). Data tidak dapat disinkronkan ke Neon.
          </span>
        </div>
      </div>
    );
  }

  if (dbStatus.status === 'disconnected') {
    return (
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-950" />
          <span className="font-medium">
            Database Neon belum terhubung. Harap pasang <code className="font-mono bg-amber-400/80 px-1 py-0.5 rounded font-bold">DATABASE_URL</code> di Secrets.
          </span>
        </div>
        <button
          onClick={verifyHealth}
          disabled={isChecking}
          className="flex items-center gap-1 text-[11px] font-bold underline ml-2 hover:opacity-80"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Cek Ulang</span>
        </button>
      </div>
    );
  }

  return null;
};
