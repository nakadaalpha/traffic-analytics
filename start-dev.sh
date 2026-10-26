#!/bin/bash

# Custom Click & CTA Tracking Tool - Runner Script (Cloudflare Workers + Next.js)
echo "=========================================================="
echo "⚡ Starting Custom Click & CTA Tracking Fullstack Environment"
echo "   Mode: ISOLATED LOCAL DEVELOPMENT"
echo "=========================================================="

# Matikan child processes saat script di-close (Ctrl+C)
trap "kill 0" EXIT

# 0. Verifikasi & Siapkan Database Lokal Miniflare D1
echo "📦 [0/2] Checking Local Cloudflare D1 Database..."
LOCAL_DB=$(find backend/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ -name "*.sqlite" ! -name "metadata.sqlite" 2>/dev/null | head -n 1)

if [ -n "$LOCAL_DB" ]; then
  TABLE_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users';" 2>/dev/null || echo "0")
  if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "⚙️ Initializing local database schema & seed data..."
    sqlite3 "$LOCAL_DB" < backend/schema.d1.sql
    sqlite3 "$LOCAL_DB" < backend/seed.sql
    echo "✅ Local database schema & seed data successfully injected!"
  else
    echo "✅ Local database ready (tables and seed detected)."
  fi
fi

# 1. Jalankan Backend Cloudflare Workers (Port 5000)
echo "🚀 [1/2] Launching Cloudflare Workers Backend on port 5000..."
npm run dev --workspace=backend &
BACKEND_PID=$!

# Tunggu backend inisialisasi sebentar
sleep 2

# Jika database baru pertama kali dibuat oleh wrangler dev di atas, pastikan skema & seed di-inject
if [ -z "$LOCAL_DB" ]; then
  sleep 2
  NEW_DB=$(find backend/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ -name "*.sqlite" ! -name "metadata.sqlite" 2>/dev/null | head -n 1)
  if [ -n "$NEW_DB" ]; then
    TABLE_COUNT=$(sqlite3 "$NEW_DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users';" 2>/dev/null || echo "0")
    if [ "$TABLE_COUNT" -eq "0" ]; then
      sqlite3 "$NEW_DB" < backend/schema.d1.sql
      sqlite3 "$NEW_DB" < backend/seed.sql
      echo "✅ Fresh local database initialized and seeded!"
    fi
  fi
fi

# 2. Jalankan Frontend (Port 3000)
echo "✨ [2/2] Launching Next.js 16 Frontend Client on port 3000..."
export BACKEND_INTERNAL_URL=http://localhost:5000
npm run dev --workspace=frontend &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✅ Fullstack Local Development Environment is Live!"
echo "   - Frontend UI : http://localhost:3000"
echo "   - Backend API : http://localhost:5000"
echo "   - Dev Account : epicerie (epicieriekiosk@gmail.com)"
echo "   - Dev Password: nomnomnom"
echo "=========================================================="
echo ""
echo "Tekan [Ctrl + C] untuk menghentikan seluruh layanan."

wait
