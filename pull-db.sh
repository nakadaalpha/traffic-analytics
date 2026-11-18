#!/bin/bash
set -e

# Firenalytics - Sync Remote Cloudflare D1 Database to Local Development
echo "=========================================================="
echo "📦 Menyinkronkan Database Cloudflare D1 Publik ke Lokal..."
echo "=========================================================="

# 1. Ekspor dari Cloudflare D1 remote
echo "⬇️  [1/3] Mengunduh snapshot dari D1 publik (traffic_analytics_db)..."
npx wrangler d1 export traffic_analytics_db --remote --output=./backend/remote_snapshot.sql -y --cwd=backend

# 2. Cari file database SQLite lokal Miniflare
echo "⚙️  [2/3] Menginjeksi data ke database lokal Miniflare..."
LOCAL_DB=$(find backend/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ -name "*.sqlite" ! -name "metadata.sqlite" 2>/dev/null | head -n 1)

if [ -n "$LOCAL_DB" ]; then
  # Hapus database lokal lama dan ganti dengan struktur fresh dari snapshot
  rm -f "${LOCAL_DB}"*
  sqlite3 "$LOCAL_DB" < ./backend/remote_snapshot.sql
  echo "✅ Database lokal berhasil di-refresh dengan data publik terbaru!"
else
  # Jika file lokal belum ada, inisialisasi via wrangler execute
  npx wrangler d1 execute traffic_analytics_db --local --file=./remote_snapshot.sql -y --cwd=backend
  echo "✅ Database lokal baru berhasil dibuat dan diisi data publik!"
fi

# 3. Bersihkan file snapshot sementara
echo "🧹 [3/3] Membersihkan file snapshot sementara..."
rm -f ./backend/remote_snapshot.sql

echo "=========================================================="
echo "✨ Sinkronisasi Selesai!"
echo "   Akun, proyek, dan data prospek publik kini siap digunakan di lokal."
echo "   Silakan jalankan: npm run dev (atau ./start-dev.sh)"
echo "=========================================================="

