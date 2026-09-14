import { ensureTablesExist, getDb } from '../../server/db';

export default async function handler(req: any, res: any) {
  const sql = getDb();
  if (!sql) return res.status(503).json({ error: 'DATABASE_URL belum dikonfigurasi.' });
  try {
    const ready = await ensureTablesExist();
    if (!ready.ok) return res.status(500).json({ error: ready.message });

    if (req.method === 'POST') {
      const b = req.body || {};
      const userId = String(b.user_id || '');
      const name = String(b.name || '').trim();
      const type = String(b.type || '');
      if (!userId || !name || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Data kategori tidak valid.' });
      }
      const max = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS p FROM categories WHERE user_id=${userId} AND type=${type}`;
      const rows = await sql`
        INSERT INTO categories (id, user_id, name, type, icon_color, icon_name, is_default, position)
        VALUES (${String(b.id)}, ${userId}, ${name}, ${type}, ${String(b.icon_color || '#059669')}, ${String(b.icon_name || 'Tag')}, ${Boolean(b.is_default)}, ${Number(max[0].p)})
        RETURNING *
      `;
      return res.status(201).json({ category: rows[0] });
    }
    return res.status(405).json({ error: 'Method tidak didukung.' });
  } catch (error) {
    console.error('categories API error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Server error.' });
  }
}
