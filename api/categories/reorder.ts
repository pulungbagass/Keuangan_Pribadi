import { ensureTablesExist, getDb } from '../../server/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method tidak didukung.' });
  const sql = getDb();
  if (!sql) return res.status(503).json({ error: 'DATABASE_URL belum dikonfigurasi.' });

  const userId = String(req.body?.user_id || '');
  const ids = Array.isArray(req.body?.category_ids) ? req.body.category_ids.map(String) : [];
  if (!userId || !ids.length) return res.status(400).json({ error: 'user_id dan category_ids wajib diisi.' });

  try {
    const ready = await ensureTablesExist();
    if (!ready.ok) return res.status(500).json({ error: ready.message });

    const owned = await sql`
      SELECT id FROM categories WHERE user_id = ${userId} AND id = ANY(${ids})
    `;
    if (owned.length !== ids.length) {
      return res.status(403).json({ error: 'Sebagian kategori bukan milik user ini.' });
    }

    for (let position = 0; position < ids.length; position++) {
      await sql`
        UPDATE categories
        SET position = ${position}
        WHERE id = ${ids[position]} AND user_id = ${userId}
      `;
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('reorder categories API error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Server error.' });
  }
}
