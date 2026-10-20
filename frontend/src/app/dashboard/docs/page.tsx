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
} from 'lucide-react';

interface FrameworkGuide {
  id: string;
  name: string;
  badge: string;
  fileTarget: string;
  codeSnippet: string;
  note?: string;
}

const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    id: 'vite',
    name: 'React + Vite',
    badge: 'Paling Populer',
    fileTarget: 'index.html (di folder root)',
    codeSnippet: `<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Website Saya</title>

    <!-- ClickTracker Universal Script -->
    <script
      defer
      data-project-id="PROJECT_ID_ANDA"
      data-write-key="WRITE_KEY_ANDA"
      src="https://traffic-analytics-taupe.vercel.app/tracker.js">
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    note: 'Otomatis mendukung localhost port 5173 saat dijalankan dengan npm run dev.',
  },
  {
    id: 'next-app',
    name: 'Next.js (App Router)',
    badge: 'Next.js 13/14/15/16',
    fileTarget: 'src/app/layout.tsx atau app/layout.tsx',
    codeSnippet: `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <Script
          defer
          data-project-id="PROJECT_ID_ANDA"
          data-write-key="WRITE_KEY_ANDA"
          src="https://traffic-analytics-taupe.vercel.app/tracker.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    note: 'Gunakan strategy="afterInteractive" agar tidak membebani First Contentful Paint (FCP).',
  },
  {
    id: 'html',
    name: 'HTML / PHP / WordPress / Shopify',
    badge: 'Universal',
    fileTarget: 'index.html / header.php / footer.php',
    codeSnippet: `<!-- Sisipkan sebelum </head> atau sebelum </body> -->
<script
  defer
  data-project-id="PROJECT_ID_ANDA"
  data-write-key="WRITE_KEY_ANDA"
  src="https://traffic-analytics-taupe.vercel.app/tracker.js">
</script>`,
    note: 'Bisa digunakan di CMS apa pun (WordPress, Webflow, Blogger, Shopify, Laravel Blade).',
  },
  {
    id: 'vue',
    name: 'Vue.js / Nuxt',
    badge: 'Vue 3 & Nuxt 3',
    fileTarget: 'index.html (Vue) atau nuxt.config.ts (Nuxt)',
    codeSnippet: `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          defer: true,
          'data-project-id': 'PROJECT_ID_ANDA',
          'data-write-key': 'WRITE_KEY_ANDA',
          src: 'https://traffic-analytics-taupe.vercel.app/tracker.js',
        },
      ],
    },
  },
});`,
    note: 'Untuk Vue polos berbasis Vite, gunakan cara yang sama persis dengan React Vite di index.html.',
  },
  {
    id: 'astro',
    name: 'Astro',
    badge: 'Astro Islands',
    fileTarget: 'src/layouts/Layout.astro',
    codeSnippet: `---
// src/layouts/Layout.astro
---
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <script
      defer
      data-project-id="PROJECT_ID_ANDA"
      data-write-key="WRITE_KEY_ANDA"
      src="https://traffic-analytics-taupe.vercel.app/tracker.js"
    ></script>
  </head>
  <body>
    <slot />
  </body>
</html>`,
    note: 'Script berjalan otomatis di client-side tanpa memengaruhi static site generation.',
  },
];

export default function DocsPage() {
  const [selectedTab, setSelectedTab] = useState(FRAMEWORK_GUIDES[0].id);
  const [copied, setCopied] = useState(false);

  const activeGuide = FRAMEWORK_GUIDES.find((g) => g.id === selectedTab) || FRAMEWORK_GUIDES[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-3">
          <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
          <span>Panduan Integrasi SDK</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Cara Memasang ClickTracker ke Website Anda
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
          Pemasangan membutuhkan waktu kurang dari 2 menit. Sisipkan script di website Anda dan tambahkan atribut penanda pada tombol atau link yang ingin dilacak.
        </p>
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
              {activeGuide.codeSnippet}
            </pre>

            <button
              type="button"
              onClick={() => handleCopy(activeGuide.codeSnippet)}
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

      {/* Langkah 2: Menandai Elemen */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
          <span>Tandai Elemen atau Tombol yang Ingin Dilacak</span>
        </h2>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Tambahkan atribut <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-800 font-mono">data-track-cta=&quot;nama-tombol-unik&quot;</code> pada tombol, link kontak, atau form submit mana pun di HTML/JSX Anda. Script ClickTracker menggunakan <em>Global Event Delegation</em> sehingga tidak memerlukan setup listener tambahan:
        </p>

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
