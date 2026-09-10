import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getDb, ensureTablesExist } from './server/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Default categories
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', type: 'expense', icon_color: '#f97316', icon_name: 'Utensils' },
  { name: 'Transportasi & Bensin', type: 'expense', icon_color: '#3b82f6', icon_name: 'Car' },
  { name: 'Belanja & Groceries', type: 'expense', icon_color: '#8b5cf6', icon_name: 'ShoppingBag' },
  { name: 'Tagihan, Listrik & WiFi', type: 'expense', icon_color: '#eab308', icon_name: 'Zap' },
  { name: 'Hiburan & Hobi', type: 'expense', icon_color: '#ec4899', icon_name: 'Film' },
  { name: 'Kesehatan & Medis', type: 'expense', icon_color: '#ef4444', icon_name: 'HeartPulse' },
  { name: 'Pendidikan & Kursus', type: 'expense', icon_color: '#6366f1', icon_name: 'GraduationCap' },
  { name: 'Lain-lain', type: 'expense', icon_color: '#64748b', icon_name: 'MoreHorizontal' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji Pokok', type: 'income', icon_color: '#10b981', icon_name: 'Briefcase' },
  { name: 'Bonus & THR', type: 'income', icon_color: '#06b6d4', icon_name: 'Gift' },
  { name: 'Freelance & Side Project', type: 'income', icon_color: '#0284c7', icon_name: 'Laptop' },
  { name: 'Investasi & Dividen', type: 'income', icon_color: '#059669', icon_name: 'TrendingUp' },
  { name: 'Transfer & Pengembalian', type: 'income', icon_color: '#8b5cf6', icon_name: 'ArrowDownLeft' },
];

async function seedUserCategoriesIfEmpty(sql: any, userId: string) {
  try {
    const existing = (await sql`SELECT id FROM categories WHERE user_id = ${userId} LIMIT 1`) as any[];
    if (existing.length === 0) {
      const allCats = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      for (const cat of allCats) {
        const catId = `cat_${cat.type === 'expense' ? 'exp' : 'inc'}_${userId}_${Math.random().toString(36).substring(2, 7)}`;
        await sql`
          INSERT INTO categories (id, user_id, name, type, icon_color, icon_name, is_default)
          VALUES (${catId}, ${userId}, ${cat.name}, ${cat.type}, ${cat.icon_color}, ${cat.icon_name}, true)
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }
  } catch (err) {
    console.error('Error seeding categories in Neon:', err);
  }
}

// ---------------- API ROUTES ----------------

// 1. Health & Database connection check
app.get('/api/health', async (req, res) => {
  const sql = getDb();
  if (!sql) {
    return res.json({
      status: 'ok',
      database: 'disconnected',
      message: 'DATABASE_URL belum dikonfigurasi di environment variable.',
    });
  }

  try {
    const tablesCheck = await ensureTablesExist();
    if (!tablesCheck.ok) {
      return res.json({
        status: 'ok',
        database: 'error',
        message: tablesCheck.message,
      });
    }

    const testQuery = await sql`SELECT current_database(), current_user, version()`;
    res.json({
      status: 'ok',
      database: 'connected',
      details: testQuery[0],
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// 2. Email Registration Endpoint (Pure Neon Database)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const passHash = crypto.createHash('sha256').update(password + '_ck_finance_salt_2026').digest('hex');
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=059669`;

  const sql = getDb();
  if (!sql) {
    return res.status(503).json({
      error: 'Database Neon belum terhubung. Pastikan DATABASE_URL telah diset pada Secrets / Environment Variables.',
    });
  }

  try {
    await ensureTablesExist();
    const existing = (await sql`SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1`) as any[];
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar di database Neon.' });
    }

    await sql`
      INSERT INTO users (id, email, name, image_url, auth_provider, password_hash)
      VALUES (${userId}, ${cleanEmail}, ${cleanName}, ${avatar}, 'password', ${passHash})
    `;

    await seedUserCategoriesIfEmpty(sql, userId);

    return res.json({
      success: true,
      user: { id: userId, email: cleanEmail, name: cleanName, image_url: avatar, auth_provider: 'password' },
      database: 'connected',
    });
  } catch (err: any) {
    console.error('Neon DB Registration error:', err);
    return res.status(500).json({ error: err?.message || 'Gagal menyimpan akun ke database Neon.' });
  }
});

// 3. Email Login Endpoint (Pure Neon Database)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const passHash = crypto.createHash('sha256').update(password + '_ck_finance_salt_2026').digest('hex');

  const sql = getDb();
  if (!sql) {
    return res.status(503).json({
      error: 'Database Neon belum terhubung. Pastikan DATABASE_URL telah diset pada Secrets / Environment Variables.',
    });
  }

  try {
    await ensureTablesExist();
    const users = (await sql`SELECT * FROM users WHERE email = ${cleanEmail} LIMIT 1`) as any[];
    if (users.length === 0) {
      return res.status(404).json({ error: 'Akun dengan email ini belum terdaftar di database Neon. Silakan buka tab Daftar.' });
    }
    const user = users[0];
    if (user.password_hash && user.password_hash !== passHash) {
      return res.status(401).json({ error: 'Kata sandi tidak sesuai.' });
    }

    await seedUserCategoriesIfEmpty(sql, user.id);

    return res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, image_url: user.image_url, auth_provider: 'password' },
      database: 'connected',
    });
  } catch (err: any) {
    console.error('Neon DB Login error:', err);
    return res.status(500).json({ error: err?.message || 'Gagal autentikasi database Neon.' });
  }
});

// 5. Fetch Full User Financial Data (Transactions, Categories, Reminders)
app.get('/api/user-data', async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId parameter required' });

  const sql = getDb();
  if (!sql) {
    return res.json({ synced: false, transactions: [], categories: [], reminders: [] });
  }

  try {
    await ensureTablesExist();
    await seedUserCategoriesIfEmpty(sql, userId);

    const [txs, cats, rems] = (await Promise.all([
      sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY transaction_date DESC`,
      sql`SELECT * FROM categories WHERE user_id = ${userId} ORDER BY name ASC`,
      sql`SELECT * FROM reminders WHERE user_id = ${userId} ORDER BY due_date ASC`,
    ])) as [any[], any[], any[]];

    // Format fields
    const formattedTxs = txs.map(t => ({
      id: t.id,
      user_id: t.user_id,
      category_id: t.category_id,
      type: t.type,
      amount: Number(t.amount),
      transaction_date: new Date(t.transaction_date).toISOString(),
      details: typeof t.details === 'string' ? JSON.parse(t.details) : (t.details || {}),
      created_at: new Date(t.created_at).toISOString(),
    }));

    const formattedCats = cats.map(c => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      type: c.type,
      icon_color: c.icon_color,
      icon_name: c.icon_name,
      is_default: Boolean(c.is_default),
    }));

    const formattedRems = rems.map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      amount: r.amount ? Number(r.amount) : undefined,
      due_date: typeof r.due_date === 'string' ? r.due_date : new Date(r.due_date).toISOString().split('T')[0],
      status: r.status,
      notes: r.notes,
      created_at: new Date(r.created_at).toISOString(),
    }));

    res.json({
      synced: true,
      transactions: formattedTxs,
      categories: formattedCats,
      reminders: formattedRems,
    });
  } catch (err: any) {
    console.error('Error fetching user data from Neon:', err);
    res.status(500).json({ error: err?.message });
  }
});

// 6. Add Transaction
app.post('/api/transactions', async (req, res) => {
  const { id, user_id, category_id, type, amount, transaction_date, details } = req.body;
  const sql = getDb();
  if (!sql) {
    return res.json({ synced: false, message: 'Saved locally' });
  }

  try {
    await ensureTablesExist();
    const txId = id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const dateVal = transaction_date ? new Date(transaction_date).toISOString() : new Date().toISOString();
    const detailsJson = JSON.stringify(details || {});

    await sql`
      INSERT INTO transactions (id, user_id, category_id, type, amount, transaction_date, details)
      VALUES (${txId}, ${user_id}, ${category_id || null}, ${type}, ${Number(amount)}, ${dateVal}, ${detailsJson}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount,
        type = EXCLUDED.type,
        category_id = EXCLUDED.category_id,
        transaction_date = EXCLUDED.transaction_date,
        details = EXCLUDED.details
    `;

    res.json({ success: true, id: txId, synced: true });
  } catch (err: any) {
    console.error('Neon save transaction error:', err);
    res.status(500).json({ error: err?.message });
  }
});

// 7. Delete Transaction
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    if (userId) {
      await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      await sql`DELETE FROM transactions WHERE id = ${id}`;
    }
    res.json({ success: true, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 8. Add Category
app.post('/api/categories', async (req, res) => {
  const { id, user_id, name, type, icon_color, icon_name } = req.body;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    const catId = id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await sql`
      INSERT INTO categories (id, user_id, name, type, icon_color, icon_name, is_default)
      VALUES (${catId}, ${user_id}, ${name}, ${type}, ${icon_color || '#059669'}, ${icon_name || 'Tag'}, false)
      ON CONFLICT (id) DO NOTHING
    `;
    res.json({ success: true, id: catId, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 9. Delete Category
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    if (userId) {
      await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      await sql`DELETE FROM categories WHERE id = ${id}`;
    }
    res.json({ success: true, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 10. Add Reminder
app.post('/api/reminders', async (req, res) => {
  const { id, user_id, title, amount, due_date, status, notes } = req.body;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    const remId = id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await sql`
      INSERT INTO reminders (id, user_id, title, amount, due_date, status, notes)
      VALUES (${remId}, ${user_id}, ${title}, ${amount ? Number(amount) : null}, ${due_date}, ${status || 'pending'}, ${notes || ''})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        amount = EXCLUDED.amount,
        due_date = EXCLUDED.due_date,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes
    `;
    res.json({ success: true, id: remId, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 11. Toggle Reminder Status
app.patch('/api/reminders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, user_id } = req.body;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    if (user_id) {
      await sql`UPDATE reminders SET status = ${status} WHERE id = ${id} AND user_id = ${user_id}`;
    } else {
      await sql`UPDATE reminders SET status = ${status} WHERE id = ${id}`;
    }
    res.json({ success: true, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 12. Delete Reminder
app.delete('/api/reminders/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string;
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    if (userId) {
      await sql`DELETE FROM reminders WHERE id = ${id} AND user_id = ${userId}`;
    } else {
      await sql`DELETE FROM reminders WHERE id = ${id}`;
    }
    res.json({ success: true, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// 13. Reset User Data
app.post('/api/data/reset', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const sql = getDb();
  if (!sql) return res.json({ synced: false });

  try {
    await Promise.all([
      sql`DELETE FROM transactions WHERE user_id = ${user_id}`,
      sql`DELETE FROM reminders WHERE user_id = ${user_id}`,
    ]);
    res.json({ success: true, synced: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// ---------------- VITE MIDDLEWARE & SERVER START ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
