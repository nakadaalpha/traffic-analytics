/**
 * audit-bulk.mjs
 * Script Otomasi Bulk Audit Google Lighthouse (Standar Industri).
 * Memindai seluruh rute utama dashboard Firenalytics secara berurutan.
 */

import { execSync } from 'child_process';
import http from 'http';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:3000';

const TARGET_ROUTES = [
  { name: 'Ringkasan & Analytics Live', path: '/dashboard' },
  { name: 'Katalog Interaksi & Events', path: '/dashboard/events' },
  { name: 'Manajemen Sosial Media', path: '/dashboard/social' },
  { name: 'Katalog Konten & Postingan Feed', path: '/dashboard/social/posts' },
  { name: 'Inbound Leads CRM & Pipeline', path: '/dashboard/leads' },
  { name: 'Manajemen Proyek & Integrasi', path: '/dashboard/projects' },
];

function checkServerReady(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port || 3000,
          path: '/',
          method: 'HEAD',
          timeout: 3000,
        },
        (res) => {
          resolve(res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  console.log('='.repeat(65));
  console.log('  FIRENALYTICS - AUTOMATED LIGHTHOUSE BULK AUDITOR');
  console.log('='.repeat(65));
  console.log(`Target Host: ${BASE_URL}\n`);

  console.log('1. Memeriksa ketersediaan server lokal...');
  const isReady = await checkServerReady(BASE_URL);

  if (!isReady) {
    console.warn(`[PERINGATAN] Server pada ${BASE_URL} belum aktif atau tidak merespons.`);
    console.warn(`Silakan pastikan server frontend berjalan terlebih dahulu dengan:`);
    console.warn(`  cd frontend && npm run dev (atau npm run start untuk hasil produksi optimal)\n`);
  } else {
    console.log(`[OK] Server terdeteksi aktif pada ${BASE_URL}.\n`);
  }

  console.log('2. Matriks Rute yang Masuk dalam Scope Audit:');
  TARGET_ROUTES.forEach((r, idx) => {
    console.log(`   ${idx + 1}. [${r.name}] -> ${BASE_URL}${r.path}`);
  });

  console.log('\n3. Menjalankan Lighthouse CI Bulk Runner:');
  console.log('   Konfigurasi terbaca dari: ./lighthouserc.json');
  console.log('   Command: npx @lhci/cli autorun --config=../lighthouserc.json\n');

  try {
    execSync('npx @lhci/cli autorun --config=../lighthouserc.json', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('\n[SELESAI] Seluruh pengujian bulk audit telah berhasil dieksekusi.');
  } catch (err) {
    console.log('\nCatatan: Jika @lhci/cli belum terpasang secara global di mesin Anda, jalankan:');
    console.log('  npm install -g @lhci/cli');
    console.log('Lalu ulangi pengujian dengan:');
    console.log('  npm run audit\n');
  }
}

main().catch(console.error);

