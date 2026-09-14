import { ensureTablesExist, getDb } from '../server/db';

const DEFAULT_PAYMENT_METHODS = [
  'Tunai / Cash', 'QRIS BCA', 'Transfer Mandiri', 'Transfer BRI',
  'GoPay', 'OVO', 'ShopeePay', 'Kartu Kredit',
];
const DEFAULT_TAGS = ['Primer', 'Sekunder', 'Lifestyle', 'Kerja', 'Keluarga', 'Mendesak', 'Harian'];

export default async function handler(req: any, res: any) {
  const sql = getDb();
  if (!sql) return res.status(503).json({ error: 'DATABASE_URL belum dikonfigurasi.' });
  const ready = await ensureTablesExist();
  if (!ready.ok) return res.status(500).json({ error: ready.message });

  try {
    if (req.method === 'GET') {
      const userId = String(req.query?.userId || '');
      if (!userId) return res.status(400).json({ error: 'userId wajib diisi.' });

      let rows = await sql`
        SELECT id, user_id, kind, value, position, created_at
        FROM user_transaction_options
        WHERE user_id = ${userId}
        ORDER BY kind, position, created_at
      `;

      // First login: create defaults for this user only.
      if (rows.length === 0) {
        const defaults = [
          ...DEFAULT_PAYMENT_METHODS.map((value, position) => ({ kind: 'payment_method', value, position })),
          ...DEFAULT_TAGS.map((value, position) => ({ kind: 'tag', value, position })),
        ];
        for (const item of defaults) {
          await sql`
            INSERT INTO user_transaction_options (id, user_id, kind, value, position)
            VALUES (${`opt_${item.kind}_${userId}_${item.position + 1}`}, ${userId}, ${item.kind}, ${item.value}, ${item.position})
            ON CONFLICT DO NOTHING
          `;
        }
        rows = await sql`
          SELECT id, user_id, kind, value, position, created_at
          FROM user_transaction_options
          WHERE user_id = ${userId}
          ORDER BY kind, position, created_at
        `;
      }
      return res.status(200).json({ options: rows });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const userId = String(body.user_id || '');
      const kind = String(body.kind || '');
      const value = String(body.value || '').trim();
      if (!userId || !['payment_method', 'tag'].includes(kind) || !value) {
        return res.status(400).json({ error: 'user_id, kind, dan value wajib valid.' });
      }

      const existing = await sql`
        SELECT id, user_id, kind, value, position, created_at
        FROM user_transaction_options
        WHERE user_id = ${userId} AND kind = ${kind} AND lower(value) = lower(${value})
        LIMIT 1
      `;
      if (existing.length) return res.status(200).json({ option: existing[0] });

      const max = await sql`
        SELECT COALESCE(MAX(position), -1) + 1 AS next_position
        FROM user_transaction_options
        WHERE user_id = ${userId} AND kind = ${kind}
      `;
      const position = Number(max[0].next_position);
      const id = String(body.id || `opt_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

      const rows = await sql`
        INSERT INTO user_transaction_options (id, user_id, kind, value, position)
        VALUES (${id}, ${userId}, ${kind}, ${value}, ${position})
        RETURNING id, user_id, kind, value, position, created_at
      `;
      return res.status(201).json({ option: rows[0] });
    }

    return res.status(405).json({ error: 'Method tidak didukung.' });
  } catch (error) {
    console.error('user-options API error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Server error.' });
  }
}
