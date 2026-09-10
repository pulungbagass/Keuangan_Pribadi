import { Category, Reminder, Transaction, User } from '../types';

const STORAGE_USERS_KEY = 'ck_db_users';
const STORAGE_CATEGORIES_KEY = 'ck_db_categories';
const STORAGE_TRANSACTIONS_KEY = 'ck_db_transactions';
const STORAGE_REMINDERS_KEY = 'ck_db_reminders';

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
  const users = getFromStorage<User[]>(STORAGE_USERS_KEY, []);
  if (!users.some(u => u.id === user.id)) {
    users.push(user);
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

// ---------------- CATEGORY OPERATIONS ----------------
export function getCategories(userId: string): Category[] {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  return all.filter(c => c.user_id === userId);
}

export function addCategory(userId: string, data: Omit<Category, 'id' | 'user_id'>): Category {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  const newCat: Category = {
    ...data,
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
  };
  all.push(newCat);
  saveToStorage(STORAGE_CATEGORIES_KEY, all);
  return newCat;
}

export function deleteCategory(userId: string, categoryId: string): boolean {
  const all = getFromStorage<Category[]>(STORAGE_CATEGORIES_KEY, []);
  const filtered = all.filter(c => !(c.id === categoryId && c.user_id === userId));
  saveToStorage(STORAGE_CATEGORIES_KEY, filtered);
  return true;
}

// ---------------- TRANSACTION OPERATIONS ----------------
export function getTransactions(userId: string): Transaction[] {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  return all
    .filter(t => t.user_id === userId)
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

export function addTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
): Transaction {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const newTx: Transaction = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  all.unshift(newTx);
  saveToStorage(STORAGE_TRANSACTIONS_KEY, all);
  return newTx;
}

export function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>
): Transaction | null {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const idx = all.findIndex(t => t.id === id && t.user_id === userId);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...updates,
    details: {
      ...all[idx].details,
      ...(updates.details || {}),
    },
  };

  saveToStorage(STORAGE_TRANSACTIONS_KEY, all);
  return all[idx];
}

export function deleteTransaction(userId: string, id: string): boolean {
  const all = getFromStorage<Transaction[]>(STORAGE_TRANSACTIONS_KEY, []);
  const filtered = all.filter(t => !(t.id === id && t.user_id === userId));
  saveToStorage(STORAGE_TRANSACTIONS_KEY, filtered);
  return true;
}

// ---------------- REMINDER OPERATIONS ----------------
export function getReminders(userId: string): Reminder[] {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  return all
    .filter(r => r.user_id === userId)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export function addReminder(
  userId: string,
  data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>
): Reminder {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const newReminder: Reminder = {
    ...data,
    id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  all.push(newReminder);
  saveToStorage(STORAGE_REMINDERS_KEY, all);
  return newReminder;
}

export function toggleReminderStatus(userId: string, id: string): Reminder | null {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const item = all.find(r => r.id === id && r.user_id === userId);
  if (!item) return null;

  item.status = item.status === 'pending' ? 'paid' : 'pending';
  saveToStorage(STORAGE_REMINDERS_KEY, all);
  return item;
}

export function deleteReminder(userId: string, id: string): boolean {
  const all = getFromStorage<Reminder[]>(STORAGE_REMINDERS_KEY, []);
  const filtered = all.filter(r => !(r.id === id && r.user_id === userId));
  saveToStorage(STORAGE_REMINDERS_KEY, filtered);
  return true;
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
