import { ensureTablesExist, getDb } from '../../server/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method tidak didukung.' });
  const sql = getDb();
  if (!sql) return res.status(503).json({ error: 'DATABASE_URL belum dikonfigurasi.' });
  const id = String(req.query?.id || '');
  const userId = String(req.query?.userId || '');
  if (!id || !userId) return res.status(400).json({ error: 'id dan userId wajib diisi.' });

  try {
    const ready = await ensureTablesExist();
    if (!ready.ok) return res.status(500).json({ error: ready.message });
    const result = await sql`DELETE FROM categories WHERE id=${id} AND user_id=${userId}`;
    return res.status(200).json({ success: true, deleted: result.count ?? 0 });
  } catch (error) {
    console.error('delete category API error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Server error.' });
  }
}
