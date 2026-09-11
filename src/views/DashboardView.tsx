import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ChevronRight,
  PlusCircle,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
} from 'lucide-react';
import { Category, Reminder, TabRoute, TimeFilterMode, Transaction, User } from '../types';
import { formatRupiah, formatShortDate, formatTimeIndo, getRelativeDays } from '../utils/format';
import { CategoryIcon } from '../components/common/CategoryIcon';

interface DashboardViewProps {
  user: User;
  transactions: Transaction[];
  categories: Category[];
  reminders: Reminder[];
  onNavigateTab: (tab: TabRoute) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  transactions,
  categories,
  reminders,
  onNavigateTab,
  onSelectTransaction,
}) => {
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('monthly');

  // Map categories for lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);

      if (filterMode === 'daily') {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (filterMode === 'weekly') {
        const diffMs = now.getTime() - txDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      } else if (filterMode === 'monthly') {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [transactions, filterMode]);

  // Totals calculations
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
      } else {
        exp += t.amount;
      }
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      netBalance: inc - exp,
    };
  }, [filteredTransactions]);

  // All-time balance across all transactions
  const totalAllTimeBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  // Expense by Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { category: Category; total: number }> = {};

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categoryMap.get(t.category_id) || {
          id: t.category_id,
          name: 'Lainnya',
          type: 'expense',
          icon_color: '#64748b',
          user_id: user.id,
        };

        if (!map[cat.id]) {
          map[cat.id] = { category: cat, total: 0 };
        }
        map[cat.id].total += t.amount;
      });

    const list = Object.values(map).sort((a, b) => b.total - a.total);
    return list;
  }, [filteredTransactions, categoryMap, user.id]);

  // Pending urgent reminders
  const urgentReminders = useMemo(() => {
    return reminders
      .filter(r => r.status === 'pending')
      .slice(0, 2);
  }, [reminders]);

  return (
    <div className="app-page-wide space-y-4">
      {/* 1. Filter Time Tabs */}
      <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
        {(['daily', 'weekly', 'monthly', 'all'] as TimeFilterMode[]).map(mode => {
          const labels: Record<TimeFilterMode, string> = {
            daily: 'Harian',
            weekly: 'Mingguan',
            monthly: 'Bulanan',
            all: 'Semua',
          };
          const isActive = filterMode === mode;
          return (
            <button
              key={mode}
              id={`filter-${mode}`}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {labels[mode]}
            </button>
          );
        })}
      </div>

      {/* 2. Main Balance Card */}
      <div className="rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 shadow-lg shadow-emerald-700/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-100/90 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Saldo Akhir ({filterMode === 'monthly' ? 'Bulan Ini' : filterMode === 'weekly' ? '7 Hari' : filterMode === 'daily' ? 'Hari Ini' : 'Seluruh Waktu'})</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 border border-emerald-400/30">
            Net Cash Flow
          </span>
        </div>

        {/* Large Net Balance */}
        <div className="mt-2 mb-4">
          <p className="text-2xl sm:text-3xl font-black tracking-tight">
            {formatRupiah(netBalance)}
          </p>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">
            Akumulasi Kas Riil: {formatRupiah(totalAllTimeBalance)}
          </p>
        </div>

        {/* Income & Expense Two-Column Split */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/40">
          {/* Income Box */}
          <div className="bg-emerald-800/50 backdrop-blur-xs p-2.5 rounded-2xl border border-emerald-400/20">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[11px] font-semibold">
              <div className="p-1 rounded-full bg-emerald-500/40 text-white">
                <ArrowDownLeft className="w-3 h-3" />
              </div>
              <span>Pemasukan</span>
            </div>
            <p className="text-xs sm:text-sm font-bold mt-1 text-white truncate">
              +{formatRupiah(totalIncome)}
            </p>
          </div>

          {/* Expense Box */}
          <div className="bg-emerald-800/50 backdrop-blur-xs p-2.5 rounded-2xl border border-emerald-400/20">
            <div className="flex items-center gap-1.5 text-rose-200 text-[11px] font-semibold">
              <div className="p-1 rounded-full bg-rose-500/40 text-white">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <span>Pengeluaran</span>
            </div>
            <p className="text-xs sm:text-sm font-bold mt-1 text-rose-200 truncate">
              -{formatRupiah(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Urgent Reminders Banner (if any) */}
      {urgentReminders.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Agenda & Tagihan Terdekat</span>
            </div>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {urgentReminders.map(rem => {
              const rel = getRelativeDays(rem.due_date);
              return (
                <div
                  key={rem.id}
                  onClick={() => onNavigateTab('reminders')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-amber-100 cursor-pointer hover:bg-amber-50/50 transition"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{rem.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {rem.amount ? formatRupiah(rem.amount) : 'Perkiraan tagihan'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      rel.isPassed
                        ? 'bg-rose-100 text-rose-700'
                        : rel.isUrgent
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rel.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 & 5. Category Breakdown + Recent Transactions — stacked on mobile, side-by-side on desktop */}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800">Alokasi Pengeluaran</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {categoryBreakdown.length} Kategori
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Tidak ada pengeluaran pada rentang waktu ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryBreakdown.slice(0, 4).map(({ category, total }) => {
              const percent = totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0;
              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon
                        iconName={category.icon_name}
                        color={category.icon_color}
                        size="sm"
                      />
                      <span className="font-semibold text-slate-700 truncate">{category.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900">{formatRupiah(total)}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-medium">{percent}%</span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percent, 4)}%`,
                        backgroundColor: category.icon_color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Recent Transactions List */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">Transaksi Terkini</h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
          >
            <span>Semua Riwayat</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <p className="text-xs">Belum ada transaksi tercatat.</p>
            <button
              onClick={() => onNavigateTab('input')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Catat Transaksi Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map(tx => {
              const cat = categoryMap.get(tx.category_id);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition cursor-pointer active:scale-99"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                      iconName={cat?.icon_name}
                      color={cat?.icon_color || (isIncome ? '#10b981' : '#f97316')}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {cat?.name || 'Kategori Umum'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {formatShortDate(tx.transaction_date)} • {formatTimeIndo(tx.transaction_date)}
                        {tx.details.payment_method ? ` • ${tx.details.payment_method}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-black ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </p>
                    {tx.details.location && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[90px]">
                        {tx.details.location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
