import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Reminder, Transaction, User } from '../types';
import { formatDateIndo, formatRupiah, getRelativeDays } from '../utils/format';
import { ReminderModal } from '../components/modals/ReminderModal';

interface RemindersViewProps {
  user: User;
  reminders: Reminder[];
  onToggleStatus: (id: string) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  onAddReminder: (
    data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  onQuickPayAsTransaction: (reminder: Reminder) => Promise<void>;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  user,
  reminders,
  onToggleStatus,
  onDeleteReminder,
  onAddReminder,
  onQuickPayAsTransaction,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'paid' | 'all'>('pending');
  const [showModal, setShowModal] = useState(false);
  // Tracks reminder ids currently mid-request, so their row controls disable
  // and show a spinner instead of allowing a double-click during the await.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const withPending = async (id: string, action: () => Promise<void>) => {
    setPendingIds(prev => new Set(prev).add(id));
    try {
      await action();
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filterTab === 'pending') return r.status === 'pending';
    if (filterTab === 'paid') return r.status === 'paid';
    return true;
  });

  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const paidCount = reminders.filter(r => r.status === 'paid').length;

  return (
    <div className="app-page space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            Pengingat Tagihan
          </h2>
          <p className="section-subtitle">
            Kelola agenda pembayaran rutin tepat waktu
          </p>
        </div>

        <button
          id="btn-add-reminder-modal"
          onClick={() => setShowModal(true)}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pengingat Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 card p-1">
        <button
          onClick={() => setFilterTab('pending')}
          className={`py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
            filterTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Belum Bayar</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setFilterTab('paid')}
          className={`py-1.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
            filterTab === 'paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Sudah Lunas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
            {paidCount}
          </span>
        </button>
        <button
          onClick={() => setFilterTab('all')}
          className={`py-1.5 text-xs font-semibold rounded-xl transition ${
            filterTab === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua ({reminders.length})
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Bell className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs">
            {filterTab === 'pending'
              ? 'Hebat! Tidak ada tagihan yang tertunda saat ini.'
              : 'Belum ada pengingat pada kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReminders.map(rem => {
            const isPaid = rem.status === 'paid';
            const rel = getRelativeDays(rem.due_date);
            const isPending = pendingIds.has(rem.id);

            return (
              <div
                key={rem.id}
                className={`card p-3.5 space-y-2.5 transition ${
                  isPaid ? 'opacity-70' : ''
                } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={() => withPending(rem.id, () => onToggleStatus(rem.id))}
                      disabled={isPending}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        isPaid
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 text-transparent'
                      }`}
                      title={isPaid ? 'Tandai belum bayar' : 'Tandai sudah lunas'}
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isPaid ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {rem.title}
                      </h4>
                      {rem.amount ? (
                        <p className="text-xs font-black text-slate-700 mt-0.5">
                          {formatRupiah(rem.amount)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Due date badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : rel.isPassed
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : rel.isUrgent
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isPaid ? 'Lunas' : rel.label}
                  </span>
                </div>

                {/* Due date detail & notes */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Jatuh Tempo: {formatDateIndo(rem.due_date)}</span>
                  </div>

                  <button
                    onClick={() => withPending(rem.id, () => onDeleteReminder(rem.id))}
                    disabled={isPending}
                    className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-50"
                    title="Hapus pengingat"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {rem.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                    {rem.notes}
                  </p>
                )}

                {/* Quick Convert to Transaction if pending */}
                {!isPaid && rem.amount && (
                  <button
                    onClick={() => withPending(rem.id, () => onQuickPayAsTransaction(rem))}
                    disabled={isPending}
                    className="btn-secondary w-full py-1.5 text-[11px]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Bayar & Catat sebagai Pengeluaran</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={onAddReminder}
      />
    </div>
  );
};
