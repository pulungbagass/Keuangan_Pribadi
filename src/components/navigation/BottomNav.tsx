import React from 'react';
import { LayoutDashboard, History, PlusCircle, Bell, User } from 'lucide-react';
import { TabRoute } from '../../types';

interface BottomNavProps {
  currentTab: TabRoute;
  onChangeTab: (tab: TabRoute) => void;
  pendingRemindersCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingRemindersCount = 0,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-5 items-center px-2 py-1.5 safe-area-bottom">
        {/* 1. Dashboard */}
        <button
          id="nav-tab-dashboard"
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${currentTab === 'dashboard' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Ringkasan</span>
        </button>

        {/* 2. History */}
        <button
          id="nav-tab-history"
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
            currentTab === 'history'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          <History className={`w-5 h-5 transition-transform ${currentTab === 'history' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Riwayat</span>
        </button>

        {/* 3. Input (Center Prominent Button) */}
        <button
          id="nav-tab-input"
          onClick={() => onChangeTab('input')}
          className="flex flex-col items-center justify-center -mt-4 group min-h-[52px]"
          title="Catat Transaksi Baru"
        >
          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 group-active:scale-95 transition-all">
            <PlusCircle className="w-6 h-6 stroke-[2.4]" />
          </div>
          <span className={`text-[10px] mt-0.5 font-medium ${currentTab === 'input' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>
            Catat
          </span>
        </button>

        {/* 4. Reminders */}
        <button
          id="nav-tab-reminders"
          onClick={() => onChangeTab('reminders')}
          className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
            currentTab === 'reminders'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          <div className="relative">
            <Bell className={`w-5 h-5 transition-transform ${currentTab === 'reminders' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-0.5 animate-pulse">
                {pendingRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Pengingat</span>
        </button>

        {/* 5. Profile */}
        <button
          id="nav-tab-profile"
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[48px] ${
            currentTab === 'profile'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${currentTab === 'profile' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Akun</span>
        </button>
      </div>
    </nav>
  );
};
