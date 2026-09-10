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
} from 'lucide-react';
import { Reminder, Transaction, User } from '../types';
import { formatDateIndo, formatRupiah, getRelativeDays } from '../utils/format';
import { ReminderModal } from '../components/modals/ReminderModal';

interface RemindersViewProps {
  user: User;
  reminders: Reminder[];
  onToggleStatus: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddReminder: (data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => void;
  onQuickPayAsTransaction: (reminder: Reminder) => void;
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

  const filteredReminders = reminders.filter(r => {
    if (filterTab === 'pending') return r.status === 'pending';
    if (filterTab === 'paid') return r.status === 'paid';
    return true;
  });

  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const paidCount = reminders.filter(r => r.status === 'paid').length;

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">
            Pengingat Tagihan
          </h2>
          <p className="text-xs text-slate-400">
            Kelola agenda pembayaran rutin tepat waktu
          </p>
        </div>

        <button
          id="btn-add-reminder-modal"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pengingat Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
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

            return (
              <div
                key={rem.id}
                className={`p-3.5 rounded-2xl border transition bg-white shadow-xs space-y-2.5 ${
                  isPaid ? 'border-slate-200/60 opacity-80' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleStatus(rem.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        isPaid
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 text-transparent'
                      }`}
                      title={isPaid ? 'Tandai belum bayar' : 'Tandai sudah lunas'}
                    >
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
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
                    onClick={() => onDeleteReminder(rem.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Hapus pengingat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                    onClick={() => onQuickPayAsTransaction(rem)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Bayar & Catat sebagai Pengeluaran</span>
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
