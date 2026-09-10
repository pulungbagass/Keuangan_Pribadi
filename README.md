# Catatan Keuangan — Web App (Vercel + Neon)

Aplikasi pencatatan keuangan pribadi, full online (bukan PWA), dengan
database Neon PostgreSQL. React + Vite di frontend, Vercel Serverless
Function (Express) di backend.

## Apa yang diperbaiki dari kode asli

Kode ini awalnya dibuat dengan Google AI Studio dan tidak bisa langsung
di-deploy ke Vercel. Perubahan yang dilakukan:

1. **Bug kritis — backend tidak pernah bisa jalan di Vercel.**
   `server.ts` lama adalah Express app mandiri (`app.listen(...)`) yang
   hanya bisa jalan sebagai proses Node biasa, bukan sebagai serverless
   function. Ditambah lagi `vercel.json` lama me-rewrite **semua**
   request (termasuk `/api/*`) langsung ke `index.html`, jadi endpoint API
   tidak pernah tereksekusi sama sekali di Vercel.
   → Backend dipindah ke `api/index.ts` (Vercel Serverless Function,
   Express tanpa `app.listen`), dan `vercel.json` sekarang punya rewrite
   khusus `/api/*` ke function tersebut sebelum fallback SPA.

2. **Kode & dependency yang tidak terpakai dihapus:**
   - `@google/genai`, `google-auth-library` — sisa boilerplate AI Studio
     (Gemini API), tidak dipanggil di mana pun dalam kode.
   - `motion` — terpasang tapi tidak pernah di-import.
   - `dotenv`, `tsx`, `esbuild` (manual bundling server), `sharp` —
     hanya relevan untuk server Express mandiri / tooling AI Studio yang
     sudah tidak dipakai.
   - `vite-plugin-pwa` beserta plugin media khusus AI Studio di
     `vite.config.ts` — tidak pernah diaktifkan/dipakai.
   - Aset PWA (`pwa-192x192.png`, `pwa-512x512.png`,
     `pwa-maskable-512x512.png`, `apple-touch-icon.png`) dan folder
     `public/assets/aistudio/` — tidak direferensikan di mana pun.
   - `metadata.json` (manifest khusus AI Studio, menyebut Gemini API) dan
     `bun.lock` (basi setelah dependency berubah).
   - Header `manifest.webmanifest` / `sw.js` di `vercel.json` — aplikasi
     memang tidak memakai service worker/manifest (bukan PWA), jadi
     header itu tidak berguna.

3. **Tidak ada sistem PWA.** Tidak ada `manifest.webmanifest`, tidak ada
   service worker, tidak ada offline caching. Aplikasi murni web biasa —
   setiap kali dibuka akan mengambil data terbaru lewat request ke
   `/api/*` yang membaca/menulis langsung ke Neon.

4. **Koneksi DB dibuat lebih tahan banting** (`api/_lib/db.ts`): selain
   `DATABASE_URL`, kode sekarang juga mencoba `POSTGRES_URL`,
   `DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING` — karena nama
   variabel yang di-inject oleh integrasi Neon di Vercel Marketplace bisa
   berbeda-beda tergantung cara koneksinya dibuat.

5. `sql/schema.sql` disinkronkan dengan skema yang benar-benar dipakai
   kode (`auth_provider`, `password_hash`). Tabel sebenarnya juga
   otomatis dibuat sendiri oleh aplikasi saat pertama kali diakses, jadi
   file ini hanya referensi/opsional untuk setup manual di Neon Console.

## Struktur proyek

```
├── api/
│   ├── index.ts        # Semua endpoint /api/* (Vercel Serverless Function)
│   └── _lib/db.ts       # Koneksi Neon + auto-create table
├── src/                 # Frontend React + Vite
├── sql/schema.sql        # Referensi skema (opsional, DB dibuat otomatis)
├── vercel.json           # Rewrite /api/* -> function, sisanya -> SPA
└── vite.config.ts
```

## Cara Deploy ke Vercel

1. **Push repo ini ke GitHub/GitLab/Bitbucket**, lalu import project di
   [vercel.com/new](https://vercel.com/new). Vercel otomatis mendeteksi
   framework Vite.

2. **Hubungkan database Neon:**
   - Cara termudah: di dashboard project Vercel → tab **Storage** →
     **Create Database** → pilih **Neon** (Marketplace/Native
     Integration). Vercel akan otomatis mengisi environment variable
     koneksi database ke project ini.
   - Setelah terhubung, cek di **Settings → Environment Variables**
     apakah nama variabelnya `DATABASE_URL`. Jika Neon memberi nama lain
     (mis. `POSTGRES_URL`), kode ini sudah otomatis mencoba nama-nama
     umum tersebut (lihat `api/_lib/db.ts`) — tidak perlu diubah manual.
   - Alternatif manual: buat project di [neon.tech](https://neon.tech),
     salin connection string-nya, lalu tambahkan sendiri sebagai
     environment variable `DATABASE_URL` di Vercel.

3. **Deploy.** Klik Deploy — Vercel akan menjalankan `npm run build`
   (build Vite ke `dist/`) sekaligus men-deploy `api/index.ts` sebagai
   serverless function.

4. **Cek koneksi database** setelah deploy selesai dengan membuka:
   `https://<domain-anda>.vercel.app/api/health`
   Harus muncul `"database": "connected"`. Tabel akan otomatis dibuat
   saat pertama kali endpoint ini (atau endpoint lain) diakses.

## Pengembangan lokal

Cara paling akurat mensimulasikan lingkungan Vercel (frontend + API
serverless function sekaligus) adalah dengan Vercel CLI:

```bash
npm install
npm run dev        # menjalankan `vercel dev`
```

Saat pertama kali dijalankan, Vercel CLI akan meminta Anda login dan
menghubungkan project. Buat file `.env` (isi `DATABASE_URL`, lihat
`.env.example`) agar API bisa terhubung ke Neon saat development lokal.

Jika hanya ingin mengerjakan tampilan (tanpa API/DB), bisa pakai:

```bash
npm run dev:frontend-only
```

## Catatan keamanan (tidak diubah dari kode asli, mohon diperhatikan)

- Password di-hash dengan SHA-256 + salt statis di kode
  (`_ck_finance_salt_2026`). Ini lebih lemah dibanding algoritma khusus
  password seperti bcrypt/argon2 yang punya salt unik per-user. Untuk
  aplikasi produksi sungguhan dengan data sensitif, pertimbangkan untuk
  menggantinya.
- "Session token" di `src/services/auth.ts` adalah JWT tiruan yang dibuat
  dan diverifikasi sepenuhnya di sisi browser (tidak ditandatangani
  server, tidak diverifikasi oleh backend). Ini cukup untuk sesi
  ringan di sisi klien, tapi bukan mekanisme otentikasi API yang aman.
  Endpoint `/api/*` saat ini mempercayai `user_id` yang dikirim dari
  klien tanpa verifikasi token di server.

Kedua hal di atas sudah ada sejak kode asli dan di luar permintaan
"bersih-bersih & bisa deploy" — disebutkan di sini supaya Anda sadar
sebelum menaruh data finansial sungguhan di aplikasi ini.
