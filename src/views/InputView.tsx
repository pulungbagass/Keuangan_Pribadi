import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Category, Transaction, TransactionType, User } from '../types';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { CategoryModal } from '../components/modals/CategoryModal';

interface InputViewProps {
  user: User;
  categories: Category[];
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
  onAddCategory: (cat: Omit<Category, 'id' | 'user_id'>) => Category;
  onViewHistory: () => void;
}

const COMMON_PAYMENT_METHODS = [
  'Tunai / Cash',
  'QRIS BCA',
  'Transfer Mandiri',
  'Transfer BRI',
  'GoPay',
  'OVO',
  'ShopeePay',
  'Kartu Kredit',
];

const COMMON_TAGS = ['Primer', 'Sekunder', 'Lifestyle', 'Kerja', 'Keluarga', 'Mendesak', 'Harian'];

export const InputView: React.FC<InputViewProps> = ({
  user,
  categories,
  onSaveTransaction,
  onAddCategory,
  onViewHistory,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Progressive Disclosure: Details
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Date & Time (TIMESTAMPTZ default to now)
  const [dateTimeStr, setDateTimeStr] = useState(() => {
    const now = new Date();
    // Format YYYY-MM-DDTHH:mm:ss
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 19);
    return localISOTime;
  });

  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filter categories by type
  const availableCategories = categories.filter(c => c.type === type);

  // Select first available category when type changes
  const activeCategoryId =
    selectedCategoryId && availableCategories.some(c => c.id === selectedCategoryId)
      ? selectedCategoryId
      : availableCategories[0]?.id || '';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountStr('');
      return;
    }
    const num = parseInt(raw, 10);
    setAmountStr(new Intl.NumberFormat('id-ID').format(num));
    if (error) setError('');
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = amountStr ? parseInt(amountStr.replace(/\D/g, ''), 10) : 0;
    const next = current + addValue;
    setAmountStr(new Intl.NumberFormat('id-ID').format(next));
    if (error) setError('');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const t = customTagInput.trim().toLowerCase();
      if (!selectedTags.includes(t)) {
        setSelectedTags([...selectedTags, t]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = amountStr.replace(/\D/g, '');
    if (!rawAmount || parseInt(rawAmount, 10) <= 0) {
      setError('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (!activeCategoryId) {
      setError('Pilih minimal satu kategori transaksi.');
      return;
    }

    // Generate ISO TIMESTAMPTZ with full precision
    const txDate = new Date(dateTimeStr).toISOString();

    onSaveTransaction({
      category_id: activeCategoryId,
      type,
      amount: parseInt(rawAmount, 10),
      transaction_date: txDate,
      details: {
        payment_method: paymentMethod || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      },
    });

    // Reset Form
    setAmountStr('');
    setNotes('');
    setLocation('');
    setPaymentMethod('');
    setSelectedTags([]);
    setShowDetails(false);
    setError('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4500);
  };

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">
          Catat Transaksi
        </h2>
        <p className="text-xs text-slate-400">
          Formulir progressive dengan fleksibilitas data JSONB
        </p>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Transaksi Berhasil Dicatat!</p>
              <p className="text-[11px] text-emerald-700">Saldo & laporan telah terupdate.</p>
            </div>
          </div>
          <button
            onClick={onViewHistory}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5 underline shrink-0 ml-2"
          >
            <span>Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transaction Type Segmented Control */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1.5 rounded-2xl">
        <button
          type="button"
          id="btn-type-expense"
          onClick={() => {
            setType('expense');
            setSelectedCategoryId('');
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            type === 'expense'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pengeluaran (Expense)</span>
        </button>
        <button
          type="button"
          id="btn-type-income"
          onClick={() => {
            setType('income');
            setSelectedCategoryId('');
          }}
          className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            type === 'income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pemasukan (Income)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nominal Input Card */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Nominal Transaksi (Rp) *
          </label>
          <div className="relative">
            <span
              className={`absolute left-3.5 top-3 text-lg font-black ${
                type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              id="input-transaction-amount"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="0"
              className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-xl sm:text-2xl font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition ${
                type === 'expense'
                  ? 'border-rose-100 focus:ring-rose-500'
                  : 'border-emerald-100 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Quick amount increment chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[10000, 20000, 50000, 100000, 500000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition active:scale-95"
              >
                +{val >= 1000 ? `${val / 1000}rb` : val}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
        </div>

        {/* Category Selection with Modal Trigger */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Pilih Kategori *</label>
            <button
              type="button"
              id="btn-open-category-modal"
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          {/* Category Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {availableCategories.map(cat => {
              const isSelected = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition active:scale-98 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <CategoryIcon
                    iconName={cat.icon_name}
                    color={cat.icon_color}
                    size="sm"
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time Input (TIMESTAMPTZ second precision) */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Tanggal & Jam Transaksi (WIB)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              id="input-transaction-datetime"
              value={dateTimeStr}
              step="1"
              onChange={e => setDateTimeStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            Format standar PostgreSQL TIMESTAMPTZ presisi hingga ke detik.
          </span>
        </div>

        {/* Progressive Disclosure: Details (JSONB flexible columns) */}
        <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
          <button
            type="button"
            id="btn-toggle-details"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/80 transition text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {showDetails ? 'Sembunyikan Rincian Tambahan' : 'Tambah Detail (Opsional - Kolom JSONB)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Metode bayar, lokasi toko, catatan & label
                </p>
              </div>
            </div>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showDetails && (
            <div className="p-4 space-y-3.5 border-t border-slate-100 animate-in slide-in-from-top-2">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Metode Pembayaran</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        paymentMethod === m
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Atau ketik metode lainnya (cth: OVO Cash)"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lokasi Transaksi</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Grand Indonesia, SPBU Pertamina, Starbucks"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Catatan / Keterangan Ekstra</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tulis rincian pembelian, nomor nota, atau rekanan makan..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Label / Tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TAGS.map(t => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Ketik tag custom lalu tekan Enter..."
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-submit-transaction"
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Simpan Transaksi</span>
        </button>
      </form>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultType={type}
        onSave={newCatData => {
          const created = onAddCategory(newCatData);
          setSelectedCategoryId(created.id);
        }}
      />
    </div>
  );
};
