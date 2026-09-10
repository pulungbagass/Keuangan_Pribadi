import { neon } from '@neondatabase/serverless';

// Cache the connection across warm invocations of the same serverless instance.
let sqlClient: ReturnType<typeof neon> | null = null;

/**
 * Resolves the Postgres connection string.
 *
 * When you connect Neon to a Vercel project via the Vercel Marketplace /
 * native integration, Vercel injects the connection string as an
 * environment variable. Depending on how the integration was set up, the
 * variable may be named `DATABASE_URL` or one of Neon's alternative names
 * (pooled vs. unpooled). We check the common ones so the app keeps working
 * regardless of which exact name Vercel provisioned.
 */
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function getDb() {
  const databaseUrl = resolveDatabaseUrl();
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

// Auto-create tables if they do not exist yet.
export async function ensureTablesExist(): Promise<{ ok: boolean; message?: string }> {
  const sql = getDb();
  if (!sql) {
    return {
      ok: false,
      message:
        'DATABASE_URL belum dikonfigurasi. Hubungkan Neon melalui Vercel Marketplace atau set Environment Variable secara manual.',
    };
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        image_url TEXT,
        auth_provider VARCHAR(50) DEFAULT 'password',
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
