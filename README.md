# Catatan Keuangan — Web App (Vercel + Neon)

Aplikasi pencatatan keuangan pribadi, full online (bukan PWA), dengan
database Neon PostgreSQL. React + Vite di frontend, Vercel Serverless
Function (Express) di backend.

## Update terbaru: loading states & user feedback (toast)

Backend/koneksi database, dan seluruh sistem desain UI dari update
sebelumnya **tidak diubah** — update ini murni menambahkan indikator
loading dan feedback yang sebelumnya minim, memakai gaya/komponen yang
sudah ada (tidak ada patokan style baru):

1. **Perbaikan mendasar di `src/services/storage.ts`**: sebelumnya semua
   fungsi mutasi (`addTransaction`, `addCategory`, `addReminder`, delete,
   toggle status, dst) memakai pola *fire-and-forget* — langsung `return`
   setelah nulis ke localStorage, sementara `fetch()` ke Neon jalan di
   background tanpa ditunggu. Ini artinya UI tidak pernah benar-benar tahu
   apakah data tersimpan ke database atau gagal. Sekarang semua fungsi ini
   `async` dan `await` respons Neon sungguhan, mengembalikan
   `{ success, synced, error }` (tipe `MutationResult` di `types/index.ts`)
   sehingga UI bisa kasih feedback yang jujur.

2. **Toast notification** (`src/components/common/Toast.tsx`, baru) —
   dibangun custom pakai token desain yang sudah ada (warna, radius, shadow
   dari `index.css`), bukan library baru. Dipasang sekali di `main.tsx`
   lewat `<ToastProvider>`, dipakai lewat `useToast()` di komponen mana pun.
   Muncul di pojok kanan-atas (desktop) / atas (mobile), auto-hilang ~3.8 detik,
   bisa ditutup manual.

3. **Skeleton loading** (`src/components/common/Skeletons.tsx`, baru) —
   `DashboardSkeleton`, `HistorySkeleton`, `RemindersSkeleton` meniru bentuk
   card asli masing-masing halaman (bukan spinner generik). Tampil saat
   sinkronisasi data pertama kali dari Neon berlangsung (dicek di `App.tsx`
   lewat state `isInitialLoading`), lalu otomatis berganti ke tampilan asli.

4. **Tombol submit/mutasi** di seluruh app sekarang: disable saat proses +
   ganti teks + spinner (`Loader2` dari lucide, ikon yang sudah dipakai app
   ini) — mencegah double-click:
   - `InputView` — simpan transaksi
   - `CategoryModal` — simpan kategori baru
   - `ReminderModal` — simpan pengingat baru
   - `TransactionDetailModal` — konfirmasi hapus transaksi
   - `ProfileView` — sinkronisasi manual (sudah ada sebelumnya, dipertahankan)
     & kosongkan semua data (baru)
   - `RemindersView` — toggle lunas/belum, hapus, dan "Bayar & Catat" per
     baris (state per-item, baris lain tetap bisa dipakai saat satu baris
     sedang diproses)
   - `LoginView` — ikon pada tombol masuk/daftar sekarang benar-benar
     berputar saat loading (sebelumnya cuma teks yang berubah)

5. Toast dipakai untuk semua hasil akhir mutasi (sukses & gagal), kecuali
   di `InputView` yang sudah punya banner sukses inline dengan shortcut
   "Lihat Riwayat" — di situ toast hanya dipakai untuk kasus gagal, supaya
   tidak dobel notifikasi untuk kejadian yang sama.

## Update sebelumnya: perombakan konsistensi UI + layout desktop

Backend/koneksi database **tidak diubah sama sekali** di update ini — murni
perubahan tampilan. Ringkasan:

1. **Satu tema di seluruh app.** Sebelumnya halaman Login memakai tema gelap
   (slate-900) sementara semua halaman lain (Dashboard, History, Input,
   Reminders, Profile, semua modal) memakai tema terang. Sekarang semuanya
   terang, konsisten, dengan aksen emerald yang sama.
2. **Sistem desain terpusat** di `src/index.css` (`.card`, `.btn-primary`,
   `.btn-secondary`, `.btn-dark`, `.btn-danger`, `.field-input`,
   `.field-label`, `.app-page`, `.app-page-wide`, `.modal-overlay`,
   `.modal-panel`) — dipakai di semua view & modal supaya kartu, tombol,
   input, dan modal tidak lagi copy-paste style yang lama-lama berbeda.
3. **Layout desktop sungguhan.** Sebelumnya di layar lebar, app cuma tampil
   sebagai kolom sempit (lebar HP) mengambang di tengah layar gelap kosong.
   Sekarang:
   - Ada `Sidebar.tsx` (navigasi khusus desktop, `md:` ke atas) menggantikan
     BottomNav yang otomatis disembunyikan di layar lebar.
   - Konten memakai container yang lebih lega di desktop (`.app-page-wide`
     untuk Dashboard & History yang padat data; `.app-page` yang lebih
     ringkas untuk halaman form seperti Input/Reminders/Profile/Login).
   - Dashboard menampilkan 2 kartu bagian bawahnya (breakdown kategori +
     transaksi terkini) **berdampingan** di desktop, tetap bertumpuk di
     mobile — desktop tidak perlu identik dengan mobile, tapi tetap
     konsisten gaya visualnya.
   - Mobile **tidak berubah perilakunya sama sekali** — breakpoint hanya
     aktif di `md` (768px) ke atas.
4. Fallback warna, radius, shadow, dan skala tipografi (yang sebelumnya
   campur `rounded-xl/2xl/3xl`, `pb-24` vs `pb-28`, dll) dirapikan mengikuti
   hierarki yang konsisten.
5. File-file mati sisa merge sebelumnya (`server.ts`, `server/db.ts`,
   `metadata.json`, `bun.lock`, ikon PWA, `public/assets/aistudio/`) sudah
   dibersihkan lagi — semuanya sudah tidak dipakai sama sekali oleh
   `vercel.json`/`api/`, jadi aman dihapus tanpa memengaruhi koneksi.

## Update sebelumnya: fix error 500 di /api/auth/register

Kalau sebelumnya deploy sempat kena `500 Internal Server Error` dengan pesan
generik "Gagal mendaftar ke database Neon.", itu bukan masalah database —
penyebabnya adalah serverless function-nya **crash total** sebelum sempat
menjalankan kode Express sama sekali, karena mismatch format module
(ESM vs CommonJS) yang umum terjadi di Vercel saat `package.json` punya
`"type": "module"`. Sudah diperbaiki dengan:
- Menghapus `"type": "module"` dari `package.json` (default ke CommonJS,
  format paling kompatibel untuk Vercel Node Functions).
- Menambahkan `api/tsconfig.json` khusus (terpisah dari tsconfig root milik
  Vite) supaya Vercel meng-compile `api/index.ts` ke CommonJS murni.

Sudah divalidasi dengan cara benar-benar meng-compile `api/index.ts` ke JS
dan menjalankannya di Node — tidak ada lagi error `exports is not defined
in ES module scope` / `require is not defined in ES module scope`.

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
