-- =======================================================
-- SKEMA DATABASE POSTGRESQL (NEON)
-- APLIKASI: CATATAN KEUANGAN (WEB, FULL ONLINE)
-- =======================================================
-- Catatan: tabel-tabel ini juga dibuat otomatis oleh aplikasi
-- (lihat api/_lib/db.ts -> ensureTablesExist) saat pertama kali
-- diakses. File ini disediakan sebagai referensi / untuk setup
-- manual di Neon Console bila diperlukan.

-- 1. Ekstensi UUID (Opsional jika ingin generate uuid otomatis)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Users (otentikasi email/password & profil)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'password',
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Categories (Kategori pengeluaran & pemasukan dinamis)
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

-- 4. Tabel Transactions (Pencatatan arus kas dengan presisi detik & JSONB)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id VARCHAR(128) REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMPTZ NOT NULL, -- Presisi waktu WIB hingga ke detik
    details JSONB DEFAULT '{}'::jsonb,     -- Fleksibilitas: payment_method, location, notes, tags
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Reminders (Pengingat agenda tagihan masa depan)
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

-- 6. Optimasi Indeks Pencarian & Filter Cepat (Indexing)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
    ON transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_details_jsonb 
    ON transactions USING GIN (details);

CREATE INDEX IF NOT EXISTS idx_reminders_user_due 
    ON reminders (user_id, due_date ASC);

CREATE INDEX IF NOT EXISTS idx_categories_user 
    ON categories (user_id, type);

-- =======================================================
-- SEED DATA KATEGORI MASTER AWAL (Opsional / Template)
-- =======================================================
-- Kategori ini otomatis dibuat per-user saat login pertama kali.
