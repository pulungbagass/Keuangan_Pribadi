import { Category, MutationResult, Reminder, StoredUserAccount, Transaction, User } from '../types';

const STORAGE_USERS_KEY = 'ck_db_users';
const STORAGE_CATEGORIES_KEY = 'ck_db_categories';
const STORAGE_TRANSACTIONS_KEY = 'ck_db_transactions';
const STORAGE_REMINDERS_KEY = 'ck_db_reminders';

// Hash helper for secure local password storage
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(password + '_ck_finance_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Crypto subtle fallback', e);
  }
  // Fallback simple string hash
  return btoa(unescape(encodeURIComponent(password + '_salt')));
}

// Default categories template
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', type: 'expense' as const, icon_color: '#f97316', icon_name: 'Utensils' },
  { name: 'Transportasi & Bensin', type: 'expense' as const, icon_color: '#3b82f6', icon_name: 'Car' },
  { name: 'Belanja & Groceries', type: 'expense' as const, icon_color: '#8b5cf6', icon_name: 'ShoppingBag' },
  { name: 'Tagihan, Listrik & WiFi', type: 'expense' as const, icon_color: '#eab308', icon_name: 'Zap' },
  { name: 'Hiburan & Hobi', type: 'expense' as const, icon_color: '#ec4899', icon_name: 'Film' },
  { name: 'Kesehatan & Medis', type: 'expense' as const, icon_color: '#ef4444', icon_name: 'HeartPulse' },
  { name: 'Pendidikan & Kursus', type: 'expense' as const, icon_color: '#6366f1', icon_name: 'GraduationCap' },
  { name: 'Lain-lain', type: 'expense' as const, icon_color: '#64748b', icon_name: 'MoreHorizontal' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji Pokok', type: 'income' as const, icon_color: '#10b981', icon_name: 'Briefcase' },
  { name: 'Bonus & THR', type: 'income' as const, icon_color: '#06b6d4', icon_name: 'Gift' },
  { name: 'Freelance & Side Project', type: 'income' as const, icon_color: '#0284c7', icon_name: 'Laptop' },
  { name: 'Investasi & Dividen', type: 'income' as const, icon_color: '#059669', icon_name: 'TrendingUp' },
  { name: 'Transfer & Pengembalian', type: 'income' as const, icon_color: '#8b5cf6', icon_name: 'ArrowDownLeft' },
];

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage`, err);
  }
}

// Clean up any legacy dummy transactions and reminders
const CLEANUP_KEY = 'ck_db_cleaned_all_dummy_data_v3';
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(CLEANUP_KEY)) {
    localStorage.removeItem(STORAGE_TRANSACTIONS_KEY);
    localStorage.removeItem(STORAGE_REMINDERS_KEY);
    localStorage.setItem(CLEANUP_KEY, 'true');
  }
} catch (e) {
  console.warn('Storage cleanup notice', e);
}

// Ensure initial seed for user
export function initializeUserDatabase(user: User): void {
  // 1. Check or register user
  const users = getFromStorage<StoredUserAccount[]>(STORAGE_USERS_KEY, []);
  if (!users.some(u => u.id === user.id)) {
    users.push({ ...user });
    saveToStorage(STORAGE_USERS_KEY, users);
  }

  // 2. Check categories for user
  const categories = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  const userCategories = categories.filter(c => c.user_id === user.id);

  if (userCategories.length === 0) {
    const newCategories: Category[] = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((cat, idx) => ({
        id: `cat_exp_${user.id}_${idx + 1}`,
        user_id: user.id,
        name: cat.name,
        type: cat.type,
        icon_color: cat.icon_color,
        icon_name: cat.icon_name,
        is_default: true,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((cat, idx) => ({
        id: `cat_inc_${user.id}_${idx + 1}`,
        user_id: user.id,
        name: cat.name,
        type: cat.type,
        icon_color: cat.icon_color,
        icon_name: cat.icon_name,
        is_default: true,
      })),
    ];
    saveToStorage(STORAGE_CATEGORIES_KEY, [...categories, ...newCategories]);
  }

  // 3. Transactions & Reminders are clean/empty by default (No dummy data)
}

// ---------------- SERVER & DATABASE STATUS ----------------
export interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  message?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { status: 'disconnected', message: 'API server tidak merespons.' };
    }
    const data = await res.json();
    return {
      status: data.database === 'connected' ? 'connected' : 'disconnected',
      message: data.message,
    };
  } catch (err) {
    return { status: 'disconnected', message: 'Tidak dapat terhubung ke server backend.' };
  }
}

export async function syncUserDataWithServer(userId: string): Promise<{ synced: boolean }> {
  try {
    const res = await fetch(`/api/user-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return { synced: false };
    const data = await res.json();

    if (data.synced) {
      if (Array.isArray(data.transactions)) {
        saveToStorage(STORAGE_TRANSACTIONS_KEY, data.transactions);
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        // Merge categories
        const existing = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
        const otherUsersCats = existing.filter(c => c.user_id !== userId);
        saveToStorage(STORAGE_CATEGORIES_KEY, [...otherUsersCats, ...data.categories]);
      }
      if (Array.isArray(data.reminders)) {
        saveToStorage(STORAGE_REMINDERS_KEY, data.reminders);
      }
      return { synced: true };
    }
  } catch (e) {
    console.warn('Sync with server skipped (offline mode):', e);
  }
  return { synced: false };
}

// ---------------- USER DATABASE OPERATIONS ----------------
export function getAllRegisteredUsers(): User[] {
  const users = getFromStorage<StoredUserAccount[]>(STORAGE_USERS_KEY, []);
  return users.map(({ password_hash: _pass, ...rest }) => rest);
}

export function findUserByEmail(email: string): StoredUserAccount | null {
  const users = getFromStorage<StoredUserAccount[]>(STORAGE_USERS_KEY, []);
  const cleanEmail = email.trim().toLowerCase();
  return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

export async function registerEmailUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Format email tidak valid.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal mendaftar ke database Neon.' };
    }
    if (data.user) {
      initializeUserDatabase(data.user);
      return { success: true, user: data.user };
    }
  } catch (e) {
    return {
      success: false,
      error: 'Koneksi ke database Neon gagal. Pastikan perangkat online dan DATABASE_URL telah diset.',
    };
  }

  return { success: false, error: 'Gagal membuat akun di database Neon.' };
}

export async function loginEmailUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal masuk ke database Neon.' };
    }
    if (data.user) {
      initializeUserDatabase(data.user);
      await syncUserDataWithServer(data.user.id);
      return { success: true, user: data.user };
    }
  } catch (e) {
    return {
      success: false,
      error: 'Koneksi ke database Neon gagal. Pastikan perangkat online dan DATABASE_URL telah diset.',
    };
  }

  return { success: false, error: 'Gagal masuk akun.' };
}

export async function resetUserDataOnServer(userId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/data/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Reset data server error:', e);
    return false;
  }
}

// ---------------- CATEGORY OPERATIONS ----------------
export function getCategories(userId: string): Category[] {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  return all.filter(c => c.user_id === userId);
}

export async function addCategory(
  userId: string,
  data: Omit<Category, 'id' | 'user_id'>
): Promise<MutationResult<Category>> {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  const newCat: Category = {
    ...data,
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
  };
  all.push(newCat);
  saveToStorage(STORAGE_CATEGORIES_KEY, all);

  // Sync to Neon — awaited so the UI can show accurate loading/feedback
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: true, // local write still succeeded, category is usable
        data: newCat,
        synced: false,
        error: errData.error || 'Kategori tersimpan lokal, tapi gagal disinkron ke database Neon.',
      };
    }
    return { success: true, data: newCat, synced: true };
  } catch (err) {
    console.warn('Neon addCategory sync warning:', err);
    return {
      success: true,
      data: newCat,
      synced: false,
      error: 'Kategori tersimpan lokal, tapi koneksi ke database Neon gagal.',
    };
  }
}

export async function deleteCategory(userId: string, categoryId: string): Promise<MutationResult> {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  const filtered = all.filter(c => !(c.id === categoryId && c.user_id === userId));
  saveToStorage(STORAGE_CATEGORIES_KEY, filtered);

  try {
    const res = await fetch(
      `/api/categories/${encodeURIComponent(categoryId)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      return { success: true, synced: false, error: 'Terhapus lokal, tapi gagal disinkron ke database Neon.' };
    }
    return { success: true, synced: true };
  } catch (err) {
    console.warn('Neon deleteCategory sync warning:', err);
    return { success: true, synced: false, error: 'Terhapus lokal, tapi koneksi ke database Neon gagal.' };
  }
}

// ---------------- TRANSACTION OPERATIONS ----------------
export function getTransactions(userId: string): Transaction[] {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  return all
    .filter(t => t.user_id === userId)
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
): Promise<MutationResult<Transaction>> {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const newTx: Transaction = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  all.unshift(newTx);
  saveToStorage(STORAGE_TRANSACTIONS_KEY, all);

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx),
    });
    if (!res.ok) {
      return {
        success: true,
        data: newTx,
        synced: false,
        error: 'Transaksi tersimpan lokal, tapi gagal disinkron ke database Neon.',
      };
    }
    return { success: true, data: newTx, synced: true };
  } catch (err) {
    console.warn('Neon addTransaction sync warning:', err);
    return {
      success: true,
      data: newTx,
      synced: false,
      error: 'Transaksi tersimpan lokal, tapi koneksi ke database Neon gagal.',
    };
  }
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>
): Promise<MutationResult<Transaction>> {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const idx = all.findIndex(t => t.id === id && t.user_id === userId);
  if (idx === -1) return { success: false, synced: false, error: 'Transaksi tidak ditemukan.' };

  all[idx] = {
    ...all[idx],
    ...updates,
    details: {
      ...all[idx].details,
      ...(updates.details || {}),
    },
  };

  saveToStorage(STORAGE_TRANSACTIONS_KEY, all);

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all[idx]),
    });
    if (!res.ok) {
      return {
        success: true,
        data: all[idx],
        synced: false,
        error: 'Perubahan tersimpan lokal, tapi gagal disinkron ke database Neon.',
      };
    }
    return { success: true, data: all[idx], synced: true };
  } catch (err) {
    console.warn('Neon updateTransaction sync warning:', err);
    return {
      success: true,
      data: all[idx],
      synced: false,
      error: 'Perubahan tersimpan lokal, tapi koneksi ke database Neon gagal.',
    };
  }
}

export async function deleteTransaction(userId: string, id: string): Promise<MutationResult> {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const filtered = all.filter(t => !(t.id === id && t.user_id === userId));
  saveToStorage(STORAGE_TRANSACTIONS_KEY, filtered);

  try {
    const res = await fetch(
      `/api/transactions/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      return { success: true, synced: false, error: 'Terhapus lokal, tapi gagal disinkron ke database Neon.' };
    }
    return { success: true, synced: true };
  } catch (err) {
    console.warn('Neon deleteTransaction sync warning:', err);
    return { success: true, synced: false, error: 'Terhapus lokal, tapi koneksi ke database Neon gagal.' };
  }
}

// ---------------- REMINDER OPERATIONS ----------------
export function getReminders(userId: string): Reminder[] {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  return all
    .filter(r => r.user_id === userId)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export async function addReminder(
  userId: string,
  data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>
): Promise<MutationResult<Reminder>> {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const newReminder: Reminder = {
    ...data,
    id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  all.push(newReminder);
  saveToStorage(STORAGE_REMINDERS_KEY, all);

  try {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReminder),
    });
    if (!res.ok) {
      return {
        success: true,
        data: newReminder,
        synced: false,
        error: 'Pengingat tersimpan lokal, tapi gagal disinkron ke database Neon.',
      };
    }
    return { success: true, data: newReminder, synced: true };
  } catch (err) {
    console.warn('Neon addReminder sync warning:', err);
    return {
      success: true,
      data: newReminder,
      synced: false,
      error: 'Pengingat tersimpan lokal, tapi koneksi ke database Neon gagal.',
    };
  }
}

export async function toggleReminderStatus(userId: string, id: string): Promise<MutationResult<Reminder>> {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const item = all.find(r => r.id === id && r.user_id === userId);
  if (!item) return { success: false, synced: false, error: 'Pengingat tidak ditemukan.' };

  item.status = item.status === 'pending' ? 'paid' : 'pending';
  saveToStorage(STORAGE_REMINDERS_KEY, all);

  try {
    const res = await fetch(`/api/reminders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: item.status, user_id: userId }),
    });
    if (!res.ok) {
      return {
        success: true,
        data: item,
        synced: false,
        error: 'Status tersimpan lokal, tapi gagal disinkron ke database Neon.',
      };
    }
    return { success: true, data: item, synced: true };
  } catch (err) {
    console.warn('Neon toggleReminder sync warning:', err);
    return {
      success: true,
      data: item,
      synced: false,
      error: 'Status tersimpan lokal, tapi koneksi ke database Neon gagal.',
    };
  }
}

export async function deleteReminder(userId: string, id: string): Promise<MutationResult> {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const filtered = all.filter(r => !(r.id === id && r.user_id === userId));
  saveToStorage(STORAGE_REMINDERS_KEY, filtered);

  try {
    const res = await fetch(
      `/api/reminders/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      return { success: true, synced: false, error: 'Terhapus lokal, tapi gagal disinkron ke database Neon.' };
    }
    return { success: true, synced: true };
  } catch (err) {
    console.warn('Neon deleteReminder sync warning:', err);
    return { success: true, synced: false, error: 'Terhapus lokal, tapi koneksi ke database Neon gagal.' };
  }
}

// ---------------- CSV EXPORT ----------------
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categoriesMap: Record<string, string>,
  fileName: string = 'catatan_keuangan_transaksi.csv'
): void {
  const headers = [
    'ID Transaksi',
    'Tanggal',
    'Jam (WIB)',
    'Tipe',
    'Kategori',
    'Nominal (Rp)',
    'Metode Pembayaran',
    'Lokasi',
    'Catatan / Keterangan',
    'Tags',
  ];

  const escapeCSV = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map(tx => {
    const d = new Date(tx.transaction_date);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const categoryName = categoriesMap[tx.category_id] || 'Kategori Umum';
    const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const tagsString = tx.details.tags ? tx.details.tags.join(', ') : '';

    return [
      escapeCSV(tx.id),
      escapeCSV(dateFormatted),
      escapeCSV(timeFormatted),
      escapeCSV(typeLabel),
      escapeCSV(categoryName),
      tx.amount,
      escapeCSV(tx.details.payment_method || '-'),
      escapeCSV(tx.details.location || '-'),
      escapeCSV(tx.details.notes || '-'),
      escapeCSV(tagsString || '-'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
