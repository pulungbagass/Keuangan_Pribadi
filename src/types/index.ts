export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  email: string;
  name: string;
  image_url: string;
  auth_provider?: 'password';
  created_at?: string;
}

export interface StoredUserAccount extends User {
  password_hash?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon_color: string;
  icon_name?: string;
  is_default?: boolean;
}

export interface TransactionDetails {
  location?: string;
  notes?: string;
  payment_method?: string;
  tags?: string[];
  receipt_ref?: string;
  extra?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string; // TIMESTAMPTZ (ISO 8601 with timezone precision)
  details: TransactionDetails; // JSONB flexible storage
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  amount?: number;
  due_date: string; // ISO format or YYYY-MM-DD
  status: 'pending' | 'paid';
  category_id?: string;
  notes?: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: User;
  issuedAt: number;
  expiresAt: number; // timestamp in ms
  maxAgeMinutes: number;
}

export type TimeFilterMode = 'daily' | 'weekly' | 'monthly' | 'all';

export type TabRoute = 'dashboard' | 'history' | 'input' | 'reminders' | 'profile';

// Standard shape returned by every data-mutating operation in services/storage.ts
// so the UI can show accurate loading/success/error feedback instead of
// assuming a fire-and-forget write always succeeded.
export interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  synced: boolean; // true if the change was confirmed saved to the Neon database
  error?: string;
}
