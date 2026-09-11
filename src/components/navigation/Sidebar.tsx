import React from 'react';
import { LayoutDashboard, History, PlusCircle, Bell, User, LucideIcon } from 'lucide-react';
import { TabRoute } from '../../types';

interface SidebarProps {
  currentTab: TabRoute;
  onChangeTab: (tab: TabRoute) => void;
  pendingRemindersCount?: number;
}

interface NavItem {
  id: TabRoute;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'history', label: 'Riwayat', icon: History },
  { id: 'input', label: 'Catat Transaksi', icon: PlusCircle },
  { id: 'reminders', label: 'Pengingat', icon: Bell },
  { id: 'profile', label: 'Akun', icon: User },
];

/**
 * Desktop-only navigation rail. Hidden below the `md` breakpoint, where
 * `BottomNav` takes over instead — the two are mutually exclusive so there
 * is always exactly one navigation affordance visible.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onChangeTab,
  pendingRemindersCount = 0,
}) => {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 bg-white border-r border-slate-200/80">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs shrink-0">
          <span className="font-black text-white text-sm">CK</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-800 tracking-tight truncate">
            CATATAN KEUANGAN
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Neon PostgreSQL</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.4] text-emerald-600' : 'stroke-[1.8]'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'reminders' && pendingRemindersCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer note */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Data tersimpan langsung ke database Neon PostgreSQL secara online.
        </p>
      </div>
    </aside>
  );
};
