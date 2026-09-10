import { neon, neonConfig } from '@neondatabase/serverless';

// Cache connection
let sqlClient: ReturnType<typeof neon> | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  if (!sqlClient) {
    try {
      sqlClient = neon(databaseUrl);
    } catch (err) {
      console.error('Failed to initialize Neon SQL client:', err);
      return null;
    }
  }
  return sqlClient;
}

// Auto-create tables if they do not exist
export async function ensureTablesExist(): Promise<{ ok: boolean; message?: string }> {
  const sql = getDb();
  if (!sql) {
    return { ok: false, message: 'DATABASE_URL environment variable is not configured.' };
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        image_url TEXT,
        auth_provider VARCHAR(50) DEFAULT 'google',
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        icon_color VARCHAR(30) DEFAULT '#059669',
        icon_name VARCHAR(50) DEFAULT 'Tag',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id VARCHAR(128) REFERENCES categories(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
        transaction_date TIMESTAMPTZ NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2),
        due_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
      ON transactions (user_id, transaction_date DESC);
    `;

    return { ok: true };
  } catch (error) {
    console.error('Error ensuring tables exist in Neon:', error);
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
