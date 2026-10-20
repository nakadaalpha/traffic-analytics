#!/bin/bash

# Custom Click & CTA Tracking Tool - Runner Script (Cloudflare Workers + Next.js)
echo "=========================================================="
echo "⚡ Starting Custom Click & CTA Tracking Fullstack Environment"
echo "=========================================================="

# Matikan child processes saat script di-close (Ctrl+C)
trap "kill 0" EXIT

# 1. Jalankan Backend Cloudflare Workers (Port 5000)
echo "🚀 [1/2] Launching Cloudflare Workers Backend on port 5000..."
npm run dev --workspace=backend &
BACKEND_PID=$!

# Tunggu backend inisialisasi sebentar
sleep 2

# 2. Jalankan Frontend (Port 3000)
echo "✨ [2/2] Launching Next.js 16 Frontend Client on port 3000..."
npm run dev --workspace=frontend &
FRONTEND_PID=$!

echo ""
echo "✅ Fullstack system is live!"
echo "   - Frontend UI : http://localhost:3000"
echo "   - Backend API : http://localhost:5000/api/track/click"
echo "   - Metrics API : http://localhost:5000/api/track/metrics"
echo ""
echo "Tekan [Ctrl + C] untuk menghentikan seluruh layanan."

wait
