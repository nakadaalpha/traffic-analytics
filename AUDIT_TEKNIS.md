# Laporan Audit Teknis Codebase: Traffic & CTA Analytics

Berikut adalah laporan audit teknis mendalam (*deep repository inspection & technical analysis*) setelah refactoring dan pembersihan arsitektur total:

---

### 1. Struktur Repositori & Stack Teknologi Aktual
- **Pola Arsitektur:** **npm Workspaces (Monorepo)** bersih yang menaungi 2 workspace: `frontend/` dan `backend/`, dikelola via root `package.json`.
- **Backend:**
  - **Runtime & Framework:** **Cloudflare Workers (Edge V8 Runtime)** menggunakan **Hono v4.12** (`backend/src/worker.ts`). Seluruh stack legacy Express.js, TypeScript compiler `tsc`, dan Node.js server telah dibersihkan secara permanen.
  - **Database & Query Layer:** **Cloudflare D1** (Serverless SQLite) menggunakan Native D1 Prepared Statements API (`c.env.DB.prepare(...).bind(...).run() / .all() / .batch()`).
  - **Tooling & Orchestration:** Wrangler CLI v4.151 (`backend/wrangler.toml`).
- **Frontend:**
  - **Framework & Versi:** **Next.js v16.4.2** menggunakan **App Router** (`src/app/`) dan React v19 (`frontend/package.json`).
  - **Styling System:** Murni **Tailwind CSS v3.4** (`frontend/tailwind.config.ts`). Tidak menggunakan komponen pihak ketiga (shadcn/ui, Radix, Headless UI tidak diinstal).
  - **State Management:** Native React Hooks (`useState`, `useEffect`, `useCallback`) dengan pola Smart Polling terkoordinasi (Zustand, Redux, TanStack Query tidak digunakan).
- **Layanan Pihak Ketiga & Infrastruktur:**
  - **Frontend Hosting:** Vercel CDN (`https://traffic-analytics-taupe.vercel.app`).
  - **Backend API Hosting:** Cloudflare Workers Edge Network (`https://traffic-analytics-api.fireup-dist.workers.dev`).
  - **Database Hosting:** Cloudflare D1 (Database Name: `traffic_analytics_db`, Binding: `DB`, UUID: `3e7b6518-8ad8-4030-8677-c58f8c5460cf`).
  - **Storage / Real-time / Payment:** Tidak ada dependensi Cloudinary/S3, Pusher, maupun Payment Gateway. Real-time dijalankan melalui client-side visibility-aware polling.

---

### 2. Autentikasi, Otorisasi & Sesi
- **Mekanisme Autentikasi:** Belum ada sistem autentikasi user/login (tanpa tabel akun, tanpa hashing bcrypt, dan rute dashboard terbuka untuk umum).
- **Otorisasi Multi-Project (Client Ingestion Security):**
  - Menggunakan kombinasi **Public Write Key** (`x-write-key` / `pk_live_...`) dan **Allowed Origin Whitelist** (`backend/src/worker.ts#L182-L208`).
  - Domain request dicocokkan dengan daftar domain yang terdaftar pada kolom `allowed_origins` di tabel `projects`. Request dari origin tak terdaftar akan diabaikan secara diam-diam (*dropped silently*).
- **Role Pengguna:** Tidak ada role/permission (belum ada skema `Role` atau enum izin).
- **Sesi Pengguna (Tracking Session):** Dikelola pada `sessionStorage` browser klien dengan key `cta_session_id`, berformat `sess_<random>_<timestamp>` (`frontend/public/tracker.js#L26`).
- **Pemulihan Akun / Reset Password:** Tidak ada (fitur belum tersedia).

---

### 3. Skema Basis Data & Entitas Utama
Skema database didefinisikan secara resmi di `backend/schema.d1.sql` yang terdiri atas 3 tabel:
1. **`projects` (Tabel Induk Multi-Tenant):**
   - Kolom: `id` (TEXT, PK), `name` (TEXT), `public_write_key` (TEXT, UNIQUE), `allowed_origins` (TEXT berisi stringified JSON array domain), `is_active` (INTEGER default 1), `created_at` (TEXT UTC datetime).
2. **`click_events` (Tabel Log Event Mentah):**
   - Kolom: `id` (INTEGER, PK AUTOINCREMENT), `project_id` (TEXT, FK ke `projects.id` ON DELETE CASCADE), `element_id` (TEXT), `page_path` (TEXT), `session_id` (TEXT), `user_id` (INTEGER, nullable), `user_agent` (TEXT), `ip_address` (TEXT), `created_at` (TEXT UTC datetime).
   - Indeks: `idx_click_events_project_time` (`project_id`, `created_at DESC`), `idx_click_events_project_element` (`project_id`, `element_id`, `page_path`).
3. **`cta_metrics` (Tabel Agregasi Metrik Performa):**
   - Kolom: `project_id` (TEXT), `element_id` (TEXT), `page_path` (TEXT), `total_clicks` (INTEGER default 0), `last_clicked_at` (TEXT UTC datetime).
   - Kunci Utama Gabungan: `PRIMARY KEY (project_id, element_id, page_path)`.
   - Update Atomic: Menggunakan klausa SQLite `ON CONFLICT (project_id, element_id, page_path) DO UPDATE SET total_clicks = total_clicks + 1`.

> **Catatan:** Model e-commerce (User, Product, Cart, Order, Tracking Kurir) **belum ada di codebase ini**. Proyek ini murni berfungsi sebagai infrastruktur pelacakan CTA/traffic analytics independen.

---

### 4. Inventaris Rute API & Fitur Frontend
- **Backend Endpoints (Cloudflare Workers via Hono di `backend/src/worker.ts`):**
  - `GET /health`: Healthcheck status engine Workers dan runtime timestamp.
  - `GET /api/track/projects`: Mengambil daftar seluruh project yang terdaftar di D1 beserta allowed origins.
  - `POST /api/track/projects`: Mendaftarkan project baru, membuat UUID/slug project, dan meng-generate public write key.
  - `GET /api/track/metrics?projectId=...`: Mengambil agregasi metrik klik untuk project tertentu (limit 100).
  - `GET /api/track/events?projectId=...`: Mengambil 50 riwayat klik mentah terakhir untuk audit.
  - `POST /api/track/click`: Endpoint pelacakan klik non-blocking (langsung membalas `HTTP 204 No Content`, eksekusi database berjalan di background worker via `c.executionCtx.waitUntil`).
- **Frontend Pages/Views (Next.js App Router):**
  - `/` (`frontend/src/app/page.tsx`): Landing page publik interaktif untuk pengujian CTA playground & simulasi tombol keranjang.
  - `/dashboard` (`frontend/src/app/dashboard/page.tsx`): Halaman utama dashboard analytics dengan tabel agregasi live (`MetricsLiveTable.tsx`).
  - `/dashboard/events` (`frontend/src/app/dashboard/events/page.tsx`): Audit log riwayat klik mentah (menampilkan IP masked, User Agent, dan Session ID).
  - `/dashboard/projects` (`frontend/src/app/dashboard/projects/page.tsx`): Formulir pendaftaran website/project baru + Generator Script Tag `<script defer src=".../tracker.js">`.
  - `/profile` (`frontend/src/app/profile/page.tsx`): Halaman demo form pengaturan profil untuk demonstrasi pelacakan event submit form.
  - `/tracker.js` (`frontend/public/tracker.js`): Universal tracking library vanila JS (~1 KB) untuk ditanamkan ke website eksternal.

---

### 5. Logika Bisnis Khusus & Technical Debt
- **Logika Bisnis & Proteksi Khusus:**
  - **Smart Visibility Polling:** Polling dashboard (`MetricsLiveTable.tsx#L40` & `events/page.tsx#L42`) otomatis dijeda saat tab tidak aktif (`document.visibilityState !== 'visible'`) guna menghemat kuota limit invocations harian Cloudflare Workers.
  - **GDPR / UU PDP IP Masking:** Mengaburkan oktet terakhir alamat IP klien sebelum disimpan ke database D1 (`backend/src/worker.ts#L23`).
  - **In-Memory Rate Limiter:** Pembatasan maksimal 100 request/menit per IP di sisi Workers untuk menangkal spamming atau bot (`backend/src/worker.ts#L36`).
  - **Client-Side Cooldown:** Debouncing 500 ms per elemen ID di sisi browser untuk mencegah klik ganda tak disengaja.
- **Status Technical Debt Saat Ini:**
  - **Zero Legacy Debt:** Seluruh controller Express lama, skema Prisma yang redundan, driver `node-pg`, dan dependensi usang telah berhasil dihapus.
  - **Next Step Rekomendasi:** Menambahkan proteksi autentikasi (misal: Auth.js / Supabase Auth / Clerk) pada dashboard `/dashboard/*` agar metrik proyek tidak dapat dibaca oleh publik tanpa hak akses.
