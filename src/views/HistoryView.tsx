import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { formatDateIndo, formatRupiah, formatTimeIndo } from '../utils/format';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { exportTransactionsToCSV } from '../services/storage';

interface HistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  categories,
  onSelectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Categories dictionary for CSV export
  const categoryDict = useMemo(() => {
    const dict: Record<string, string> = {};
    categories.forEach(c => {
      dict[c.id] = c.name;
    });
    return dict;
  }, [categories]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Type filter
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }
      // 2. Category filter
      if (selectedCatId !== 'all' && tx.category_id !== selectedCatId) {
        return false;
      }
      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = categoryMap.get(tx.category_id)?.name.toLowerCase() || '';
        const notes = tx.details.notes?.toLowerCase() || '';
        const location = tx.details.location?.toLowerCase() || '';
        const payment = tx.details.payment_method?.toLowerCase() || '';
        const tags = (tx.details.tags || []).join(' ').toLowerCase();

        return (
          catName.includes(q) ||
          notes.includes(q) ||
          location.includes(q) ||
          payment.includes(q) ||
          tags.includes(q)
        );
      }
      return true;
    });
  }, [transactions, filterType, selectedCatId, searchQuery, categoryMap]);

  // Group transactions by date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      const dateKey = tx.transaction_date.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const fileName = `riwayat_keuangan_${new Date().toISOString().split('T')[0]}.csv`;
    exportTransactionsToCSV(filteredTransactions, categoryDict, fileName);
  };

  return (
    <div className="app-page-wide space-y-4">
      {/* Header & Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            Riwayat Transaksi
          </h2>
          <p className="section-subtitle">
            Histori pencatatan lengkap presisi hingga ke detik
          </p>
        </div>

        {/* CSV Export Button (Brainstorming Section 6) */}
        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          disabled={filteredTransactions.length === 0}
          className="btn-dark px-3 py-1.5 text-xs shadow-xs disabled:opacity-50"
          title="Unduh seluruh riwayat sebagai file CSV / Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            id="input-search-history"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kategori, catatan, lokasi..."
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          id="btn-toggle-filter"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-2xl border transition ${
            showFilters || filterType !== 'all' || selectedCatId !== 'all'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
          title="Filter transaksi"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Filter Controls */}
      {showFilters && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 animate-in fade-in">
          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Jenis Arus Kas
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'all'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`py-1 text-xs font-semibold rounded-lg transition ${
                  filterType === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Kategori Spesifik
            </label>
            <select
              value={selectedCatId}
              onChange={e => setSelectedCatId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.type === 'income' ? '[+] ' : '[-] '} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(filterType !== 'all' || selectedCatId !== 'all' || searchQuery) && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedCatId('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction List (Grouped by Day) */}
      {groupedByDate.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <p className="text-xs">Tidak ada riwayat transaksi yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateKey, items]) => {
            // Calculate day total
            let dayIncome = 0;
            let dayExpense = 0;
            items.forEach(it => {
              if (it.type === 'income') dayIncome += it.amount;
              else dayExpense += it.amount;
            });

            return (
              <div key={dateKey} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateIndo(dateKey)}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 space-x-2">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+{formatRupiah(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">-{formatRupiah(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Day Items Card */}
                <div className="card p-2 space-y-1">
                  {items.map(tx => {
                    const cat = categoryMap.get(tx.category_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer active:scale-99"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryIcon
                            iconName={cat?.icon_name}
                            color={cat?.icon_color || (isIncome ? '#10b981' : '#f97316')}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {cat?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {formatTimeIndo(tx.transaction_date)}
                              </span>
                              {tx.details.payment_method && (
                                <span>• {tx.details.payment_method}</span>
                              )}
                              {tx.details.location && (
                                <span className="truncate">• {tx.details.location}</span>
                              )}
                            </div>
                            {tx.details.notes && (
                              <p className="text-[10px] text-slate-500 italic truncate mt-0.5">
                                "{tx.details.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <p
                            className={`text-xs sm:text-sm font-black ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                          </p>
                          {tx.details.tags && tx.details.tags.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium inline-block mt-0.5">
                              #{tx.details.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
