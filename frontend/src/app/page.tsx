"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Cpu,
  BookOpen,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* 1. Public Navbar */}
      <nav className="w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white">
              <Zap className="w-5 h-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              Firenalytics
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-zinc-600">
            <a
              href="#features"
              className="hover:text-zinc-900 transition-colors"
            >
              Fitur Unggulan
            </a>
            <Link
              href="/dashboard/docs"
              className="hover:text-zinc-900 transition-colors"
            >
              Dokumentasi &amp; Panduan
            </Link>
          </div>

          {/* Tombol Masuk ke Dashboard Analitik */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex-1">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Next.js 16 App Router &bull; Cloudflare Workers &bull; D1 SQLite
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Pelacakan Klik &amp; CTA <br />
            Tanpa Beban Loading, Aman &amp; Real-Time
          </h1>

          <p className="text-zinc-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Infrastruktur pelacakan konversi ringan dengan Global Event
            Delegation, Beacon API, Cloudflare Workers Edge Computing, dan
            Atomic D1 UPSERT.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Buka Dashboard Analitik</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard/docs"
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 font-medium text-xs border border-zinc-200 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span>Lihat Panduan Integrasi</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Fitur Unggulan Section */}
      <section
        id="features"
        className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
            <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900">
              Non-blocking Delivery
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Pengiriman Beacon HTTP tidak mengganggu thread utama browser,
              menjaga kecepatan loading website klien.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
            <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900">
              Serverless Edge API
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Dijalankan di Cloudflare Workers dengan latensi terendah dan
              uptime tinggi di seluruh dunia.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
            <div className="p-2 rounded-lg bg-zinc-100 w-fit text-zinc-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900">
              Multi-tenant &amp; Privacy
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Isolasi data proyek per pengguna secara terproteksi, dengan IP
              masking otomatis.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Firenalytics. Hak cipta
            dilindungi.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/dashboard/docs" className="hover:text-zinc-900">
              Dokumentasi
            </Link>
            <Link href="/login" className="hover:text-zinc-900">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
