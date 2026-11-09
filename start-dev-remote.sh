#!/bin/bash

# Custom Click & CTA Tracking Tool - Runner Script (Remote D1 Mode)
echo "=========================================================="
echo "⚡ Starting Firenalytics Fullstack Environment"
echo "   Mode: LOCAL CODE + LIVE REMOTE D1 DATABASE"
echo "=========================================================="

# Matikan child processes saat script di-close (Ctrl+C)
trap "kill 0" EXIT

# 1. Jalankan Backend Cloudflare Workers (Port 5000) dengan binding Remote D1
echo "🚀 [1/2] Launching Cloudflare Workers Backend on port 5000 (Connected to Remote D1)..."
npm run dev:remote --workspace=backend &
BACKEND_PID=$!

# Beri jeda inisialisasi backend
sleep 3

# 2. Jalankan Frontend (Port 3000)
echo "✨ [2/2] Launching Next.js 16 Frontend Client on port 3000..."
export BACKEND_INTERNAL_URL=http://localhost:5000
npm run dev --workspace=frontend &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✅ Fullstack Local Environment is Live with Live Social Accounts!"
echo "   - Frontend UI : http://localhost:3000"
echo "   - Leads CRM   : http://localhost:3000/dashboard/leads"
echo "   - Backend API : http://localhost:5000"
echo "=========================================================="
echo "Tekan Ctrl+C untuk menghentikan server."

wait

