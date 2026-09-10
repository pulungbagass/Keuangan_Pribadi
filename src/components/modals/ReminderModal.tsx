import React, { useState } from 'react';
import { X, Bell, Calendar, DollarSign, FileText } from 'lucide-react';
import { Reminder } from '../../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama atau judul pengingat tagihan wajib diisi');
      return;
    }
    if (!dueDate) {
      setError('Tanggal jatuh tempo wajib ditentukan');
      return;
    }

    const cleanAmount = amountStr ? parseInt(amountStr.replace(/\D/g, ''), 10) : undefined;

    onSave({
      title: title.trim(),
      amount: cleanAmount && !isNaN(cleanAmount) ? cleanAmount : undefined,
      due_date: dueDate,
      status: 'pending',
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmountStr('');
    setNotes('');
    setError('');
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountStr('');
      return;
    }
    const num = parseInt(raw, 10);
    setAmountStr(new Intl.NumberFormat('id-ID').format(num));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Pengingat Tagihan</h3>
              <p className="text-xs text-slate-400">Jaga keuangan tetap tepat waktu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Agenda / Tagihan *
            </label>
            <input
              type="text"
              id="input-reminder-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Contoh: Tagihan Listrik PLN, Cicilan Mobil, Spotify"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
          </div>

          {/* Amount (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perkiraan Nominal (Rp) <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                id="input-reminder-amount"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Jatuh Tempo *
            </label>
            <div className="relative">
              <input
                type="date"
                id="input-reminder-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Ekstra <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              id="input-reminder-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: No Pelanggan 5321099, bayar lewat m-Banking"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-reminder"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition"
            >
              Simpan Pengingat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
