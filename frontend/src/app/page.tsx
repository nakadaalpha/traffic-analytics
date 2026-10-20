'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [cartCount, setCartCount] = useState(3);
  const [lastClickedName, setLastClickedName] = useState<string | null>(null);

  const handleCartClick = () => {
    setCartCount((prev) => prev + 1);
    setLastClickedName('navbar-cart-btn');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* 1. Public Navbar */}
      <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-lg">
              ⚡
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              ClickTracker <span className="text-sky-400 font-semibold text-xs px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800">PRO</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Fitur Unggulan
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Arsitektur
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Uji Coba CTA
            </a>
            <Link href="/profile" className="hover:text-white transition-colors">
              Demo Profil
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Tombol Keranjang CTA Navbar dengan data-track-cta="navbar-cart-btn" */}
            <button
              type="button"
              data-track-cta="navbar-cart-btn"
              onClick={handleCartClick}
              className="relative px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              title="Keranjang Belanja"
            >
              <span>🛒 Keranjang</span>
              <span className="bg-sky-500 text-slate-950 rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                {cartCount}
              </span>
            </button>

            {/* Tombol Masuk ke Dashboard Analitik */}
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-sky-950 transition-all flex items-center gap-1.5"
            >
              <span>Buka Dashboard &rarr;</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex-1">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="space-y-6 relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Next.js 16 App Router &bull; Express.js &bull; PostgreSQL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Pelacakan Klik &amp; CTA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
              Tanpa Beban Loading, Aman &amp; Real-Time
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Infrastruktur pelacakan konversi berkinerja tinggi dengan Global Event Delegation, 
            Beacon API, Non-blocking Express response (HTTP 204), dan Atomic PostgreSQL UPSERT.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              data-track-cta="landing-hero-enter-dashboard"
              onClick={() => setLastClickedName('landing-hero-enter-dashboard')}
              className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-sky-950 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>📊 Masuk ke Dashboard Analytics</span>
              <span>&rarr;</span>
            </Link>

            <a
              href="#demo"
              data-track-cta="landing-hero-try-demo"
              onClick={() => setLastClickedName('landing-hero-try-demo')}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-800 font-semibold text-sm transition-all cursor-pointer"
            >
              Coba Klik Tombol Demo
            </a>
          </div>

          {lastClickedName && (
            <div className="inline-block mt-4 px-3 py-1 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-full animate-fade-in font-mono">
              ✓ Event CTA terkirim via Beacon: <strong>{lastClickedName}</strong>
            </div>
          )}
        </div>
      </section>

      {/* 3. Interactive CTA Playground Section */}
      <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🎯</span> Interactive CTA Playground
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol di bawah ini. Event klik langsung dikirim ke backend dan tercatat di dashboard.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
            >
              Lihat di Dashboard &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              type="button"
              data-track-cta="cta-landing-download-brochure"
              onClick={() => setLastClickedName('cta-landing-download-brochure')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-center space-y-2 transition-all active:scale-95 cursor-pointer"
            >
              <div className="text-2xl">📥</div>
              <div className="text-sm font-bold text-white">Unduh Brosur</div>
              <div className="text-[11px] text-slate-400 font-mono">cta-landing-download-brochure</div>
            </button>

            <button
              type="button"
              data-track-cta="cta-landing-subscribe-newsletter"
              onClick={() => setLastClickedName('cta-landing-subscribe-newsletter')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-center space-y-2 transition-all active:scale-95 cursor-pointer"
            >
              <div className="text-2xl">📬</div>
              <div className="text-sm font-bold text-white">Langganan Info</div>
              <div className="text-[11px] text-slate-400 font-mono">cta-landing-subscribe-newsletter</div>
            </button>

            <button
              type="button"
              data-track-cta="cta-landing-request-quote"
              onClick={() => setLastClickedName('cta-landing-request-quote')}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-center space-y-2 transition-all active:scale-95 cursor-pointer"
            >
              <div className="text-2xl">💼</div>
              <div className="text-sm font-bold text-white">Minta Penawaran</div>
              <div className="text-[11px] text-slate-400 font-mono">cta-landing-request-quote</div>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-extrabold text-white">Keunggulan Arsitektur</h2>
          <p className="text-slate-400 text-sm">Dirancang untuk skalabilitas tinggi tanpa merusak Web Vitals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <h3 className="font-bold text-lg text-white">Global Event Delegation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Cukup 1 event listener di dokumen. Anda tidak perlu membungkus tombol atau menulis ulang komponen React yang sudah ada.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <h3 className="font-bold text-lg text-white">Multi-Tenant &amp; Keamanan</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Dilengkapi isolasi Project ID, validasi Write-Key, Domain Whitelist (CORS check), dan IP Masking (GDPR compliance).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
              🚀
            </div>
            <h3 className="font-bold text-lg text-white">Non-Blocking HTTP 204</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Beacon API mengirim data saat user berpindah halaman tanpa menunda navigasi browser dengan status instan 204 No Content.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>Custom Click &amp; CTA Tracking Tool &bull; Next.js 16 &amp; Express.js + PostgreSQL</p>
        <p className="text-[11px] text-slate-600">
          <Link href="/dashboard" className="text-sky-400 hover:underline">
            Buka Dashboard Analitik
          </Link>
          {' '}&bull;{' '}
          <Link href="/profile" className="text-sky-400 hover:underline">
            Demo Form Profil
          </Link>
        </p>
      </footer>
    </div>
  );
}
