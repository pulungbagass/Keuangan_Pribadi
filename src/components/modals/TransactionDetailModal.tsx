import React, { useState } from 'react';
import { X, Trash2, MapPin, CreditCard, Tag, FileText, Calendar, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Transaction, Category } from '../../types';
import { formatRupiah, formatDateTimeIndo, formatTimeIndo } from '../../utils/format';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  category?: Category;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  category,
  onClose,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const details = transaction.details || {};

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      // onClose/onDelete already clears selection from the parent on success
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay animate-in fade-in">
      <div className="modal-panel p-5">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rincian Transaksi
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Nominal */}
        <div className="my-5 text-center">
          <div className="inline-flex mb-2">
            <CategoryIcon
              iconName={category?.icon_name}
              color={category?.icon_color || (isIncome ? '#10b981' : '#f97316')}
              size="lg"
            />
          </div>
          <h3 className="text-xs font-semibold text-slate-500">
            {category?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
          </h3>
          <p
            className={`text-2xl font-black mt-1 ${
              isIncome ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isIncome ? '+' : '-'} {formatRupiah(transaction.amount)}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isIncome
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isIncome ? 'Arus Kas Masuk' : 'Arus Kas Keluar'}
            </span>
          </div>
        </div>

        {/* Timestamps with high precision */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Tanggal & Waktu Presisi</span>
              <span className="font-semibold text-slate-800">
                {formatDateTimeIndo(transaction.transaction_date)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Detik: {formatTimeIndo(transaction.transaction_date)} (ISO: {transaction.transaction_date})
              </span>
            </div>
          </div>

          {/* Payment Method */}
          {details.payment_method && (
            <div className="flex items-start gap-2.5 text-slate-700 pt-2 border-t border-slate-200/60">
              <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Metode Pembayaran</span>
                <span className="font-semibold text-slate-800">{details.payment_method}</span>
              </div>
            </div>
          )}

          {/* Location */}
          {details.location && (
            <div className="flex items-start gap-2.5 text-slate-700 pt-2 border-t border-slate-200/60">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Lokasi</span>
                <span className="font-semibold text-slate-800">{details.location}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {details.notes && (
            <div className="flex items-start gap-2.5 text-slate-700 pt-2 border-t border-slate-200/60">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Catatan / Keterangan</span>
                <span className="text-slate-800 whitespace-pre-wrap">{details.notes}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {details.tags && details.tags.length > 0 && (
            <div className="flex items-start gap-2.5 text-slate-700 pt-2 border-t border-slate-200/60">
              <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Label / Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {details.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* JSONB Details info tag */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Disimpan dalam kolom JSONB Postgres</span>
            <span className="font-mono">ID: {transaction.id.substring(0, 12)}...</span>
          </div>
        </div>

        {/* Delete Confirmation Box or Action Buttons */}
        <div className="mt-5 space-y-2">
          {confirmDelete ? (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Hapus transaksi ini secara permanen?</span>
              </div>
              <p className="text-[11px] text-rose-600">
                Saldo dan ringkasan arus kas Anda akan otomatis dihitung ulang.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-white text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="btn-danger flex-1 py-2 text-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Ya, Hapus</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                id="btn-delete-tx"
                onClick={() => setConfirmDelete(true)}
                className="btn-danger-ghost px-3 py-2.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
              <button
                onClick={onClose}
                className="btn-dark flex-1 py-2.5 text-xs"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
