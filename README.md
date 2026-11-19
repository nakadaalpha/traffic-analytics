# Firenalytics: Omni-Channel Analytics & Inbound Leads CRM Engine

[![Next.js 16](https://img.shields.io/badge/Next.js-16.0.1-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1_SQLite-F38020?logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_Storage-F38020?logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Hono v4](https://img.shields.io/badge/Hono-v4.12-E36002?logo=hono)](https://hono.dev/)
[![Composio v3](https://img.shields.io/badge/Composio-v3_Tool_Router-6366F1)](https://composio.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

**Firenalytics** adalah platform analitik dan manajemen prospek terpadu (*All-in-One Growth Platform*) berarsitektur monorepo modern. Menggabungkan pelacakan klik CTA performa tinggi (*edge-first click tracking*), mesin sinkronisasi media sosial multi-platform (YouTube, TikTok, Instagram, Facebook), kecerdasan buatan (*AI Sentiment & Content Insights*), katalog postingan terdedikasi dengan proxy media Cloudflare R2, serta **Inbound Leads CRM Inbox** untuk mengelola prospek masuk dari WhatsApp Business dan Meta Direct Messages.

---

## 🚀 Fitur Unggulan

### 1. Web Traffic & CTA Analytics (`/dashboard`)
* **Edge Click Ingestion**: Pelacakan klik berlatensi rendah menggunakan Beacon API (`POST /api/track/click`), diproses langsung di Cloudflare Workers Edge dengan batch insert ke Cloudflare D1.
* **Komprehensif & Tanpa Beban**: Visualisasi rasio konversi (CTR), metrik pengunjung unik, top 10 elemen CTA, breakdown perangkat (Desktop, Mobile, Tablet), geolocation negara (IP lookup), dan tracking parameter UTM/Referrer.
* **Workspace Dual-Mode**: Mendukung workspace penuh (dengan website) maupun workspace sosial/leads murni (tanpa website) secara mulus.
* **Generator Snippet Instan**: Pembuat kode tracker siap pakai untuk Next.js/React, Vanilla HTML, dan WordPress.

### 2. Live Event Stream & Log Ingestion (`/dashboard/events`)
* **Real-Time Polling**: Stream live event klik yang masuk secara real-time.
* **Element Alias Manager**: Mengubah ID CSS teknis (`#btn-order-v1`) menjadi nama bisnis yang mudah dipahami (*"Tombol Checkout Utama"*).

### 3. Mesin Analitik Media Sosial & AI Intelligence (`/dashboard/social`)
* **Multi-Platform OAuth**: Integrasi YouTube, TikTok, Instagram, Facebook, dan GitHub via Composio v3 Tool Router.
* **Dukungan Multi-Akun**: Kelola banyak akun dalam satu platform dengan label kustom (misal `@asterramesin`, `@gflowps`, `Shorts Channel`).
* **Kartu Konten Vertikal 3:4**: Visualisasi postingan video modern (TikTok/Reels/Shorts) dengan thumbnail resolusi tinggi otomatis.
* **Bilingual AI Sentiment Analysis (ID/EN)**: Klasifikasi sentimen komentar riil, matriks waktu unggahan emas (Golden Hours UTC+7), dan kartu rekomendasi taktis.
* **Smart Link-in-Bio Generator**: Pelacak atribusi konversi dari bio media sosial langsung ke aksi klik website client.

### 4. Katalog Konten Terdedikasi (`/dashboard/social/posts`)
* **Inspeksi Konten Terpusat**: Halaman katalog mandiri untuk meninjau seluruh konten media sosial yang tersinkronisasi.
* **Cloudflare R2 Media Proxy**: Proxy gambar/video (`/api/media/:key`) untuk menjaga poster/thumbnail tetap tampil tanpa terhalang proteksi hotlink/CORS Meta atau masa kedaluwarsa URL.
* **Filter Akun & Paginasi**: Filter multi-level berdasarkan akun, platform, dan kata kunci pencarian.

### 5. Inbound Leads CRM Inbox (`/dashboard/leads`)
* **Multi-Channel Ingestion**: Penampungan prospek otomatis dari WhatsApp Business, Instagram DM, Facebook Messenger, dan Gmail.
* **Dual-View UI**: Tampilan interaktif **Kanban Board** dan **Data Table** 5 kolom proporsional (`min-w-[880px]`).
* **Siklus 7-Tahap Leads**: `NEW` ➔ `CONTACTED` ➔ `QUALIFIED` ➔ `PROPOSAL` ➔ `NEGOTIATION` ➔ `CONVERTED` ➔ `LOST`.
* **Detail Drawer Interaktif**: Riwayat obrolan lengkap masuk/keluar, catatan sales, estimasi nilai deal (IDR), dan pengingat follow-up.
* **Filter Transparan & Helper Strip**: Dropdown akun dengan indikator jumlah prospek riil (`Semua Akun (53)`, `@asterramesin (27)`, `@gflowps (25)`), serta chip helper strip 1-klik reset.
* **Interactive KPI Cockpit**: 5 kartu KPI teratas dapat diklik untuk filter cepat (Total Prospek, Baru Hari Ini, Follow-up Hari Ini, Deal Closing, dan Tingkat Kualifikasi) lengkap dengan highlight ring reaktif.
* **Sandwich Pagination**: Kontrol paginasi ganda (atas dan bawah tabel) dengan auto smooth-scroll `-85px`.
* **Ekspor CSV CRM 13 Kolom**: Unduhan data prospek terstandarisasi untuk integrasi tim penjualan eksternal.

### 6. Manajemen Workspace & Team RBAC (`/dashboard/projects`)
* **Isolasi Workspace**: Wadah terpisah untuk setiap brand atau proyek klien.
* **Keamanan Domain**: Whitelisting domain yang diizinkan (`allowed_origins`) dan manajemen API Key.
* **Kontrol Akses Peran (RBAC)**: Pembagian hak akses **Owner**, **Editor**, dan **Viewer** secara granular.

---

## 🏗️ Arsitektur Monorepo

```
traffic-analytics/
├── backend/                      # Cloudflare Workers Edge API (Hono Framework)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── composio/         # Composio v3 OAuth, Sync & Intelligence Routes
│   │   │   ├── media/            # Cloudflare R2 Media Proxy Service & Routes
│   │   │   └── webhooks/         # Meta (Instagram/FB) & WhatsApp Webhook Handlers
│   │   ├── jobs/
│   │   │   └── socialSyncJob.ts  # Scheduled Cloudflare Cron Jobs
│   │   └── worker.ts             # Hono Entry Point, Middleware, PBKDF2 Auth & Tracking
│   ├── schema.d1.sql             # Skema DDL Canonical Cloudflare D1
│   ├── seed.sql                  # Data Seeding Awal
│   └── wrangler.toml             # Konfigurasi Wrangler, D1 Database, R2 Bucket, Cron Triggers
│
├── frontend/                     # Next.js 16 App Router Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx              # Web Traffic & CTA Analytics Overview
│   │   │   │   ├── events/page.tsx       # Live Event Stream & Alias Editor
│   │   │   │   ├── social/page.tsx       # Social Analytics & AI Intelligence
│   │   │   │   ├── social/posts/page.tsx # Dedicated Social Posts Catalog
│   │   │   │   ├── leads/page.tsx        # Inbound Leads CRM (Kanban & Table)
│   │   │   │   ├── projects/page.tsx     # Workspace, Team RBAC & Domain Whitelist
│   │   │   │   └── docs/page.tsx         # In-App Integration Hub & Snippet Guide
│   │   │   ├── login/page.tsx            # Autentikasi Pengguna
│   │   │   └── register/page.tsx         # Registrasi Akun Baru
│   │   ├── components/                   # UI Komponen Terpadu & Desain Sistem
│   │   └── context/                      # AuthContext & ProjectContext (RBAC)
│   └── next.config.ts                    # Edge Reverse Proxy Rewrites ke Worker
│
├── docs/                         # Documentation-as-Code (Panduan Lengkap)
│   ├── architecture/             # Desain Sistem, Skema D1, PRD CRM, & Keamanan
│   ├── api/                      # Dokumentasi Endpoint REST, Webhook, & tracker.js
│   ├── onboarding/               # Setup Lingkungan Lokal, Variabel Env, & Case Studies
│   └── runbooks/                 # Changelog, Deployment, Cron Jobs, & Social Engine
│
├── start-dev.sh                  # Runner Lingkungan Lokal (Port 5000 & 3000)
├── start-dev-remote.sh           # Runner Frontend Lokal terhubung ke Edge Remote
└── pull-db.sh                    # Skrip Sinkronisasi Database D1 Produksi ke Lokal
```

---

## ⚡ Panduan Menjalankan Lingkungan Lokal

### Prasyarat
* **Node.js**: `>= 20.10.0` (Disarankan: Node.js 22 LTS atau 24)
* **npm**: `>= 10.0.0`
* **Cloudflare Wrangler CLI**: Sudah terinstal di dalam workspace (`v4.151.2`)

### 1. Instalasi Dependensi
Jalankan satu perintah dari root directory untuk menginstal dependensi seluruh workspace:
```bash
npm install
```

### 2. Opsi Menjalankan Server Pengembangan

#### Opsi A: Full Local Development (Backend Port 5000 + Frontend Port 3000)
Menjalankan Worker lokal (Miniflare SQLite) dan Next.js secara bersamaan:
```bash
./start-dev.sh
# atau
npm run dev
```

#### Opsi B: Local Frontend + Live Remote Backend
Menjalankan frontend Next.js di lokal (`localhost:3000`) namun langsung mem-proxy seluruh request API ke Cloudflare Workers produksi:
```bash
./start-dev-remote.sh
# atau
npm run dev:live
```

#### Opsi C: Sinkronisasi Database Produksi ke Lokal
Untuk menyalin seluruh data dari Cloudflare D1 produksi ke database lokal Miniflare:
```bash
./pull-db.sh
# atau
npm run db:pull
```

---

## 📚 Indeks Dokumentasi Teknis

Dokumentasi lengkap dikelola secara mandiri di dalam folder [`docs/`](docs/README.md):

* **Arsitektur & Desain Sistem**:
  * [Desain Sistem & Spesifikasi Teknis](docs/architecture/system-design.md)
  * [Skema Canonical Database Cloudflare D1](docs/architecture/database-schema.md)
  * [PRD Inbound Leads CRM Engine](docs/architecture/inbound-leads-engine-prd.md)
  * [Arsitektur Keamanan & RBAC](docs/architecture/security.md)
* **Spesifikasi API & Integrasi**:
  * [Dokumentasi REST API Internal](docs/api/internal-endpoints.md)
  * [Panduan Integrasi Universal tracker.js](docs/api/clicktracker-integration.md)
  * [Spesifikasi Webhook Meta & WhatsApp](docs/api/webhooks-api.md)
* **Onboarding & SOP**:
  * [Panduan Setup Lokal Developer](docs/onboarding/local-setup.md)
  * [Daftar Variabel Lingkungan & Rahasia](docs/onboarding/environment-variables.md)
  * [Playbook SWE & 42 Studi Kasus Debugging](docs/onboarding/swe-debugging-playbook-and-case-studies.md)
* **Runbook & Operasional**:
  * [Changelog & Laporan Insiden](docs/runbooks/changelog-and-incident-reports.md)
  * [Runbook Mesin Analitik Media Sosial](docs/runbooks/social-media-engine.md)
  * [Konfigurasi Cloudflare Cron Jobs](docs/runbooks/cron-jobs.md)
  * [SOP Deployment Produksi](docs/runbooks/deployment.md)

---

## 🔒 Kebijakan Keamanan & Kualitas Kode

* **Zero Machine Absolute Paths**: Seluruh referensi dokumentasi dan konfigurasi menggunakan path relatif murni tanpa jejak path sistem lokal developer.
* **Autentikasi Aman**: Hashing PBKDF2 Web Crypto dengan salt unik untuk mencegah serangan rainbow table.
* **Stateless JWT**: Penandatanganan token menggunakan HMAC-SHA256 dengan proteksi auto-eviction saat kedaluwarsa.
* **Penanganan Rate-Limiting**: Proteksi fallback otomatis untuk kuota API eksternal (YouTube Data API v3 & Meta Graph API).
