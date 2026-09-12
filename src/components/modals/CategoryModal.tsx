import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { Category, TransactionType } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: Omit<Category, 'id' | 'user_id'>) => Promise<{ success: boolean; error?: string }>;
  defaultType?: TransactionType;
}

const AVAILABLE_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#eab308', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#64748b', // Slate
];

const AVAILABLE_ICONS = [
  'Utensils',
  'Car',
  'ShoppingBag',
  'Zap',
  'Film',
  'HeartPulse',
  'GraduationCap',
  'Briefcase',
  'Gift',
  'Laptop',
  'Coffee',
  'Bus',
  'Plane',
  'Home',
  'CreditCard',
  'Wallet',
  'Sparkles',
  'MoreHorizontal',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'expense',
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSave({
        name: name.trim(),
        type,
        icon_color: selectedColor,
        icon_name: selectedIcon,
      });

      if (result.success) {
        setName('');
        setError('');
        onClose();
      } else {
        setError(result.error || 'Gagal menyimpan kategori.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-in fade-in">
      <div className="modal-panel p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <CategoryIcon iconName={selectedIcon} color={selectedColor} size="md" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Kategori Baru</h3>
              <p className="text-xs text-slate-400">Dinamis & Terhubung ke Transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="field-label">Tipe Kategori</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="field-label">Nama Kategori</label>
            <input
              type="text"
              id="input-cat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Contoh: Skincare, Kopi, Investasi Saham"
              className="field-input px-3.5 py-2.5"
            />
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
          </div>

          {/* Color picker */}
          <div>
            <label className="field-label">Pilihan Warna Aksen</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110 active:scale-95 ring-offset-2"
                  style={{
                    backgroundColor: c,
                    boxShadow: selectedColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                  }}
                >
                  {selectedColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="field-label">Pilihan Ikon</label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-2 rounded-xl flex items-center justify-center transition ${
                    selectedIcon === icon
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50'
                  }`}
                >
                  <CategoryIcon iconName={icon} color={selectedIcon === icon ? '#ffffff' : selectedColor} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary flex-1 py-2.5 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-category"
              disabled={isSubmitting}
              className="btn-primary flex-1 py-2.5 text-xs shadow-sm shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kategori</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
