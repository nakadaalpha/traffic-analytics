'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Copy,
  Check,
  Zap,
  Globe,
  Terminal,
  ShieldCheck,
  Laptop,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText,
  BookOpen,
  Share2,
  Sparkles,
  SlidersHorizontal,
  Lock,
  Server,
  Key,
} from 'lucide-react';

interface FrameworkGuide {
  id: string;
  name: string;
  badge: string;
  fileTarget: string;
  getCode: (isAutoCapture: boolean) => string;
  note?: string;
}

const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    id: 'vite',
    name: 'React (Vite)',
    badge: 'Paling Populer',
    fileTarget: 'index.html (di dalam tag <head>)',
    getCode: (auto) => `<script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: 'Sisipkan di dalam tag <head> pada index.html. Otomatis mendukung localhost:5173.',
  },
  {
    id: 'next-app',
    name: 'Next.js (App Router)',
    badge: 'Next.js 13/14/15/16',
    fileTarget: 'src/app/layout.tsx atau app/layout.tsx',
    getCode: (auto) => `import Script from 'next/script';

<Script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js"
  strategy="afterInteractive"
/>`,
    note: 'Sisipkan di dalam RootLayout. strategy="afterInteractive" menjaga kecepatan First Contentful Paint.',
  },
  {
    id: 'html',
    name: 'HTML / PHP / WordPress',
    badge: 'Universal',
    fileTarget: 'index.html / header.php / footer.php',
    getCode: (auto) => `<script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: 'Sisipkan sebelum </head> atau sebelum </body> (mendukung WordPress, Shopify, Webflow, PHP).',
  },
  {
    id: 'vue',
    name: 'Vue / Nuxt 3',
    badge: 'Vue 3 & Nuxt 3',
    fileTarget: 'index.html (Vue) atau nuxt.config.ts (Nuxt)',
    getCode: (auto) => `<script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: 'Untuk Nuxt 3, tambahkan script ke app.head.script di nuxt.config.ts. Untuk Vue Vite, sisipkan di index.html.',
  },
  {
    id: 'astro',
    name: 'Astro',
    badge: 'Astro Islands',
    fileTarget: 'src/layouts/Layout.astro (di dalam <head>)',
    getCode: (auto) => `<script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js"
></script>`,
    note: 'Sisipkan di dalam tag <head> pada berkas Layout.astro utama Anda.',
  },
];

function getApiSnippet(lang: 'js' | 'curl' | 'python' | 'php'): string {
  switch (lang) {
    case 'curl':
      return `curl -X GET "https://traffic-analytics-api.fireup-dist.workers.dev/api/v1/metrics?projectId=PROJECT_ID_ANDA" \\
  -H "x-api-key: sk_live_your_secret_key_here"`;
    case 'python':
      return `import requests

url = "https://traffic-analytics-api.fireup-dist.workers.dev/api/v1/stats?projectId=PROJECT_ID_ANDA"
headers = {
    "x-api-key": "sk_live_your_secret_key_here"
}

response = requests.get(url, headers=headers).json()
print("Total Klik:", response["data"]["totalClicks"])
print("Top CTA:", response["data"]["topPerformingCta"])`;
    case 'php':
      return `use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'x-api-key' => 'sk_live_your_secret_key_here',
])->get('https://traffic-analytics-api.fireup-dist.workers.dev/api/v1/metrics', [
    'projectId' => 'PROJECT_ID_ANDA',
]);

$metrics = $response->json();`;
    case 'js':
    default:
      return `// Contoh di Node.js / Next.js / Express
const res = await fetch('https://traffic-analytics-api.fireup-dist.workers.dev/api/v1/metrics?projectId=PROJECT_ID_ANDA', {
  headers: {
    'x-api-key': 'sk_live_your_secret_key_here',
  },
});

const { data } = await res.json();
console.log('Metrik Tombol:', data);`;
  }
}

export default function DocsPage() {
  const [selectedTab, setSelectedTab] = useState(FRAMEWORK_GUIDES[0].id);
  const [trackingMode, setTrackingMode] = useState<'smart' | 'manual'>('smart');
  const [copied, setCopied] = useState(false);
  const [selectedApiLang, setSelectedApiLang] = useState<'js' | 'curl' | 'python' | 'php'>('js');
  const [copiedApi, setCopiedApi] = useState(false);

  const activeGuide = FRAMEWORK_GUIDES.find((g) => g.id === selectedTab) || FRAMEWORK_GUIDES[0];
  const codeToDisplay = activeGuide.getCode(trackingMode === 'smart');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Panduan Integrasi &amp; Pemasangan Script
            </h1>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed pl-10.5">
            Pemasangan membutuhkan waktu kurang dari 2 menit. Sisipkan script di website Anda untuk pelacakan tombol instan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/dashboard/projects"
            className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Generator Script Proyek</span>
          </Link>
        </div>
      </div>

      {/* Tabs Pilihan Framework */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Pilih Framework atau Lingkungan Website</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {FRAMEWORK_GUIDES.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedTab(guide.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedTab === guide.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                {guide.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pilihan Mode Pelacakan: Smart Auto-Capture vs Manual Selektif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Pilih Mode Pelacakan Script</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                {trackingMode === 'smart' ? 'data-auto-capture="true"' : 'data-auto-capture="false"'}
              </span>
            </span>
            <p className="text-[11px] text-zinc-500">
              {trackingMode === 'smart' 
                ? 'Mode Smart: Otomatis mendeteksi klik tombol aksi dan logo brand tanpa koding manual.' 
                : 'Mode Manual: Hanya tombol yang secara spesifik diberi atribut data-track-cta yang akan dihitung.'}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setTrackingMode('smart')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                trackingMode === 'smart'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart (Otomatis)</span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingMode('manual')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                trackingMode === 'manual'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Manual (Selektif)</span>
            </button>
          </div>
        </div>

        {/* Detail Panduan Terpilih */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Target Berkas:</span>
              <code className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono text-xs">
                {activeGuide.fileTarget}
              </code>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[11px] font-medium border border-zinc-200">
              {activeGuide.badge}
            </span>
          </div>

          <div className="relative group">
            <pre className="p-4 rounded-lg bg-zinc-900 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
              {codeToDisplay}
            </pre>

            <button
              type="button"
              onClick={() => handleCopy(codeToDisplay)}
              className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          {activeGuide.note && (
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-zinc-700">Catatan:</span>
              <span>{activeGuide.note}</span>
            </p>
          )}

          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <span>
              Ingin langsung menyalin script dengan Project ID &amp; Write Key asli milik Anda?
            </span>
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs whitespace-nowrap self-start sm:self-auto"
            >
              <span>Generator Script Proyek</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Langkah 2: Menandai Elemen & Smart Auto-Capture */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Pelacakan Klik: Mode Otomatis vs Kustom</span>
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold border border-zinc-200 font-mono">
            Mode Aktif: {trackingMode === 'smart' ? 'Smart Auto-Capture' : 'Manual Selektif'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg border transition-all ${
              trackingMode === 'smart'
                ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                <span>Mode 1: Smart Auto-Capture (Tanpa Koding Tambahan)</span>
              </span>
              {trackingMode === 'smart' && (
                <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded font-medium">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed mb-2">
              Dengan atribut <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-800">data-auto-capture=&quot;true&quot;</code>, script akan otomatis:
            </p>
            <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside">
              <li>Mendeteksi teks tombol (misal <em>&quot;Explore&quot;</em> atau <em>&quot;Beli&quot;</em>) digabung dengan judul kartu produk (<code className="font-mono text-[11px]">812-explore</code>).</li>
              <li>Mendeteksi logo brand mobil dari tag gambar (<code className="font-mono text-[11px]">&lt;img alt=&quot;Ferrari&quot;&gt;</code> $\rightarrow$ <code className="font-mono text-[11px]">brand-ferrari</code>).</li>
              <li>Pengecualian: tambahkan atribut <code className="font-mono text-[11px]">data-track-ignore</code> pada elemen yang ingin diabaikan.</li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-lg border transition-all ${
              trackingMode === 'manual'
                ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-700" />
                <span>Mode 2: Kustomisasi Manual (Presisi Selektif)</span>
              </span>
              {trackingMode === 'manual' && (
                <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded font-medium">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed mb-2">
              Jika menggunakan <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-800">data-auto-capture=&quot;false&quot;</code>, sematkan atribut <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-800">data-track-cta=&quot;nama-event&quot;</code> pada elemen yang ingin dilacak.
            </p>
            <pre className="p-2.5 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto">
{`<button data-track-cta="btn-custom-event">
  Aksi Khusus
</button>`}
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card Contoh 1 */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Tombol WhatsApp / Kontak</span>
            </div>
            <pre className="p-3 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto">
{`<a 
  href="https://wa.me/62812345678" 
  data-track-cta="btn-hubungi-whatsapp"
>
  Hubungi via WhatsApp
</a>`}
            </pre>
          </div>

          {/* Card Contoh 2 */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>Tombol Unduh Brosur / Katalog</span>
            </div>
            <pre className="p-3 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto">
{`<a 
  href="/brosur.pdf" 
  download 
  data-track-cta="btn-download-brosur"
>
  Unduh Brosur
</a>`}
            </pre>
          </div>

          {/* Card Contoh 3 */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>Tombol Beli / Checkout</span>
            </div>
            <pre className="p-3 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto">
{`<button 
  type="button" 
  data-track-cta="btn-checkout-keranjang"
>
  Beli Sekarang
</button>`}
            </pre>
          </div>

          {/* Card Contoh 4 */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>Tombol Kirim Form Registrasi</span>
            </div>
            <pre className="p-3 rounded-md bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto">
{`<button 
  type="submit" 
  data-track-cta="form-submit-registrasi"
>
  Kirim Data
</button>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Langkah 3: Integrasi Data Eksternal (Headless REST API) */}
      <div id="api" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Integrasi REST API Eksternal (Headless Analytics)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Tarik data performa tombol dan event tracking langsung ke dashboard di aplikasi lain milik Anda (Laravel, Node.js, Python, Flutter).
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kelola Secret Key di Proyek</span>
          </Link>
        </div>

        {/* Tabel Endpoint Reference */}
        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Metode</th>
                <th className="px-4 py-2.5 font-semibold">Endpoint</th>
                <th className="px-4 py-2.5 font-semibold">Deskripsi</th>
                <th className="px-4 py-2.5 font-semibold">Otentikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white text-xs">
              <tr>
                <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">GET</td>
                <td className="px-4 py-2.5 font-mono text-zinc-900">/api/v1/stats?projectId=...</td>
                <td className="px-4 py-2.5 text-zinc-600">Ringkasan cepat (total klik, elemen aktif, top performing CTA)</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">Header x-api-key</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">GET</td>
                <td className="px-4 py-2.5 font-mono text-zinc-900">/api/v1/metrics?projectId=...</td>
                <td className="px-4 py-2.5 text-zinc-600">Daftar lengkap tombol, nama ramah/kustom, dan total klik</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">Header x-api-key</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">GET</td>
                <td className="px-4 py-2.5 font-mono text-zinc-900">/api/v1/events?projectId=...&amp;limit=50</td>
                <td className="px-4 py-2.5 text-zinc-600">Log mentah klik pengunjung real-time (maksimal 100 baris)</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">Header x-api-key</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">GET</td>
                <td className="px-4 py-2.5 font-mono text-zinc-900">/api/v1/export?projectId=...&amp;format=csv</td>
                <td className="px-4 py-2.5 text-zinc-600">Ekspor langsung dalam format spreadsheet CSV atau JSON</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">Header x-api-key</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tab Bahasa Pemrograman & Code Snippet */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSelectedApiLang('js')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedApiLang === 'js' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                JavaScript / Node.js
              </button>
              <button
                type="button"
                onClick={() => setSelectedApiLang('curl')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedApiLang === 'curl' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                cURL (Terminal)
              </button>
              <button
                type="button"
                onClick={() => setSelectedApiLang('python')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedApiLang === 'python' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => setSelectedApiLang('php')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedApiLang === 'php' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                PHP (Laravel)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const code = getApiSnippet(selectedApiLang);
                navigator.clipboard.writeText(code);
                setCopiedApi(true);
                setTimeout(() => setCopiedApi(false), 2000);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedApi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedApi ? 'Kode Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
            {getApiSnippet(selectedApiLang)}
          </pre>
        </div>
      </div>

      {/* Keunggulan & Karakteristik Teknis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900">0ms Loading Delay</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Menggunakan <code className="text-zinc-700 font-mono">navigator.sendBeacon</code> sehingga tidak menghambat navigasi pengunjung saat berpindah halaman.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
            <Laptop className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900">Auto-Allow Localhost</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Semua port dev (<code className="text-zinc-700 font-mono">:5173</code>, <code className="text-zinc-700 font-mono">:3000</code>, <code className="text-zinc-700 font-mono">:4321</code>) otomatis diizinkan untuk kemudahan pengujian lokal.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900">Privasi Terjaga</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Alamat IP pengunjung disamarkan (masked) otomatis sesuai kaidah privasi data sebelum disimpan ke database Cloudflare D1.
          </p>
        </div>
      </div>
    </div>
  );
}
