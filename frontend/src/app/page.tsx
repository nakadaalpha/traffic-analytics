"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Cpu,
  Check,
  Layers,
  Share2,
  Sparkles,
  SlidersHorizontal,
  Users,
  Globe,
  ExternalLink,
  Play,
  Eye,
  MousePointerClick,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Laptop,
  Activity,
  Building2,
  Code2,
  Lock,
  Smartphone,
  FolderCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Hook ringan IntersectionObserver untuk animasi reveal scroll
function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.12,
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

// Wrapper komponen untuk efek transisi fade-in & slide-up saat scroll
function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out transform ${
        inView
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Scroll Spy untuk highlight section aktif di Navbar
  const [activeSection, setActiveSection] = useState<string>("");

  // Tab interaktif untuk simulasi UI Showcase
  const [mockupTab, setMockupTab] = useState<"kpi" | "stream" | "social">("kpi");

  useEffect(() => {
    const sections = ["features", "social", "workspace", "how-it-works"];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const navOffset = 220;

      for (const sectionId of [...sections].reverse()) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop - navOffset;
          if (scrollY >= top) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "features", label: "Fitur Utama" },
    { id: "social", label: "Media Sosial" },
    { id: "workspace", label: "Workspace Tim" },
    { id: "how-it-works", label: "Cara Kerja" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      {/* 1. Public Sticky Navbar dengan Active Section Tracker */}
      <nav className="w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-900">
                Firenalytics
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) dengan Indikator Section Aktif */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-zinc-600">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => handleSmoothScroll(e, link.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? "text-zinc-900 bg-zinc-100/90 font-bold shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-zinc-900 rounded-full animate-in fade-in zoom-in-95 duration-200" />
                  )}
                </a>
              );
            })}
          </div>

          {/* User Auth Action Buttons */}
          <div className="flex items-center gap-2.5">
            {!loading && user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex text-xs text-zinc-500 font-medium">
                  Halo, <strong className="text-zinc-800 font-semibold">{user.name || user.username}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <span>Buka Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <span>Daftar Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold shadow-2xs hover:border-zinc-300 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Platform Analitik Konversi Web CTA &amp; Media Sosial Terpadu</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 leading-[1.12]">
            Lacak Setiap Klik CTA &amp; Pertumbuhan Media Sosial dalam Satu Dashboard
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Pantau performa tombol WhatsApp, Checkout, dan Formulir di website Anda secara otomatis tanpa beban loading, sekaligus menyinkronkan metrik subscribers &amp; views YouTube, TikTok, dan Instagram secara terpusat.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-[0.98] hover:shadow-md"
            >
              <span>{user ? "Masuk ke Dashboard" : "Mulai Gratis Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, "how-it-works")}
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-semibold text-xs sm:text-sm border border-zinc-200 transition-all flex items-center gap-2 shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <Code2 className="w-4 h-4 text-zinc-500" />
              <span>Pelajari Cara Kerja</span>
            </a>
          </div>

          {/* Key Value Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs font-medium text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Loading Delay (Beacon API)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Auto-Capture Otomatis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Account &amp; Workspace RBAC</span>
            </div>
          </div>
        </div>

        {/* 3. Interactive UI Mockup Showcase (Tab-Driven & Animated) */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-xl text-left transition-all duration-300 hover:shadow-2xl">
          {/* Simulated App Header Bar */}
          <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-zinc-100 text-xs gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span className="text-zinc-300 mx-1">|</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-medium text-zinc-700">
                <Building2 className="w-3 h-3 text-zinc-500" />
                <span>myportofolio</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">Owner</span>
              </div>
            </div>

            {/* Interactive Tab Switcher in Mockup */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setMockupTab("kpi")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  mockupTab === "kpi"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Ringkasan KPI
              </button>
              <button
                type="button"
                onClick={() => setMockupTab("stream")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  mockupTab === "stream"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Live Event Logs
              </button>
              <button
                type="button"
                onClick={() => setMockupTab("social")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  mockupTab === "social"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Media Sosial
              </button>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline font-mono">Real-Time D1 Stream</span>
            </div>
          </div>

          {/* Dynamic Mockup View Based on Tab */}
          {mockupTab === "kpi" && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Simulated KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1 hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between text-zinc-500 text-xs">
                    <span>Total Klik CTA Web</span>
                    <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-black text-zinc-900 tracking-tight">2,418</div>
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% minggu ini</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1 hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between text-zinc-500 text-xs">
                    <span>Jangkauan Media Sosial</span>
                    <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-zinc-900 tracking-tight">18,520</div>
                  <div className="text-[11px] text-zinc-500">YouTube &amp; Instagram aktif</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1 hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between text-zinc-500 text-xs">
                    <span>Top Converting CTA</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-sm font-bold text-zinc-900 truncate">btn-whatsapp-chat</div>
                  <div className="text-[11px] text-zinc-500">432 klik terverifikasi</div>
                </div>
              </div>

              {/* Simulated Chart Trendline Bar */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800">Tren Fluktuasi Klik CTA (7 Hari Terakhir)</span>
                  <span className="font-mono text-[11px]">23 Elemen Terpantau</span>
                </div>
                <div className="h-20 flex items-end gap-2 pt-2">
                  {[35, 48, 62, 95, 78, 88, 100].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        style={{ height: `${val}%` }}
                        className="w-full bg-zinc-900 rounded-t-md group-hover:bg-indigo-600 transition-colors"
                      />
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mockupTab === "stream" && (
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Log Event Real-Time Terbaru</span>
                <span className="text-zinc-500 font-mono">50 event per menit</span>
              </div>

              <div className="divide-y divide-zinc-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      btn-whatsapp-chat
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">/pricing</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                    <span>macOS &bull; Chrome</span>
                    <span className="text-zinc-600 font-medium">Semarang, ID</span>
                    <span className="text-zinc-400 font-mono">Baru saja</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                      btn-checkout-keranjang
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">/products/12</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                    <span>iOS &bull; Safari</span>
                    <span className="text-zinc-600 font-medium">Jakarta, ID</span>
                    <span className="text-zinc-400 font-mono">2 mnt lalu</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-red-50 text-red-800 border border-red-200 font-semibold">
                      youtube-watch-cta
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">/blog/peluncuran</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                    <span>Windows &bull; Edge</span>
                    <span className="text-zinc-600 font-medium">Surabaya, ID</span>
                    <span className="text-zinc-400 font-mono">5 mnt lalu</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mockupTab === "social" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>YouTube Channel</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                    Terhubung
                  </span>
                </div>
                <div className="text-xl font-black text-zinc-900">12,450 Subscribers</div>
                <p className="text-[11px] text-zinc-500">Total 48 konten video terbit dengan 184.2K total views.</p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fuchsia-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-600" />
                    <span>Instagram Profile</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                    Terhubung
                  </span>
                </div>
                <div className="text-xl font-black text-zinc-900">6,070 Followers</div>
                <p className="text-[11px] text-zinc-500">Rata-rata interaksi postingan 4.8% per minggu.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Supported Frameworks & Ecosystem Bar */}
      <RevealOnScroll>
        <section className="py-10 border-y border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-xs uppercase tracking-widest font-bold text-zinc-400">
              Dapat Diterapkan di Seluruh Ekosistem Web &amp; Media Sosial
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-zinc-700">
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                Next.js 14 / 15 / 16
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                React (Vite)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                WordPress / PHP
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                Vue 3 / Nuxt 3
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                Astro
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-colors">
                HTML / Webflow
              </span>
              <span className="text-zinc-300 hidden sm:inline">&bull;</span>
              <span className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                YouTube
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-800">
                TikTok
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700">
                Instagram
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                Facebook
              </span>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 5. Fitur Unggulan Section (4 Pillars) */}
      <section
        id="features"
        className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12"
      >
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Fitur Kelas Enterprise
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900">
              Dirancang untuk Pengembang, Marketer, dan Agensi Modern
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Tidak ada konfigurasi rumit, tidak ada beban script berat. Seluruh infrastruktur dirancang untuk akurasi data tertinggi.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Smart Auto-Capture */}
          <RevealOnScroll delay={100}>
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 h-full">
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 w-fit">
                  <Sparkles className="w-5 h-5 text-zinc-800" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Smart Auto-Capture CTA
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Mendeteksi tombol aksi dan logo brand secara otomatis tanpa koding event manual. Cukup sematkan script, tombol penting Anda langsung tercatat.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-zinc-400">
                data-auto-capture=&quot;true&quot;
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 2: Cross-Platform Social Media */}
          <RevealOnScroll delay={200}>
            <div
              id="social"
              className="scroll-mt-28 p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 h-full"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 w-fit border border-indigo-100">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Koneksi Media Sosial Resmi
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Hubungkan channel YouTube, TikTok, dan Instagram melalui Composio OAuth resmi. Pantau subscribers, total views, dan performa konten postingan.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-indigo-600 font-semibold">
                OAuth 2.0 Direct Auth
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 3: Multi-Account & Workspace RBAC */}
          <RevealOnScroll delay={300}>
            <div
              id="workspace"
              className="scroll-mt-28 p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 h-full"
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit border border-emerald-100">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Workspace Tim &amp; Multi-Tenant
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Kelola banyak brand dan website klien dalam workspace terpisah. Atur hak akses kolaborator dengan peran aman: Owner, Editor, dan Viewer.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-emerald-600 font-semibold">
                Role-Based Access Control
              </div>
            </div>
          </RevealOnScroll>

          {/* Card 4: Edge Serverless Engine */}
          <RevealOnScroll delay={400}>
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 h-full">
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 w-fit">
                  <Cpu className="w-5 h-5 text-zinc-800" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Cloudflare Workers &amp; D1
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Infrastruktur pelacakan global dengan Beacon HTTP non-blocking. Mengurangi latency pengiriman data hingga 0ms tanpa memperlambat website Anda.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-zinc-400">
                Edge Ingestion &bull; SQLite D1
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 6. Cara Kerja 3 Langkah Mudah */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-zinc-200"
      >
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Instalasi Mudah
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900">
              Mulai dalam 3 Langkah Sederhana
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Tidak memerlukan konfigurasi rumit. Anda siap menerima data analitik pertama dalam kurang dari dua menit.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <RevealOnScroll delay={100}>
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 relative hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 h-full">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Daftarkan Website &amp; Workspace
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Buat akun, daftarkan domain website Anda di dashboard, dan sistem akan langsung menghasilkan Public Write Key unik Anda.
              </p>
            </div>
          </RevealOnScroll>

          {/* Step 2 */}
          <RevealOnScroll delay={200}>
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 relative hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 h-full">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Pasang 1 Baris Script Tracker
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Salin kode script yang telah disediakan dan tempelkan ke tag <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">&lt;head&gt;</code> template web Anda (Next.js, Vite, WordPress, dsb).
              </p>
            </div>
          </RevealOnScroll>

          {/* Step 3 */}
          <RevealOnScroll delay={300}>
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3 relative hover:border-zinc-300 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 h-full">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Pantau Konversi Real-Time
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Buka dashboard untuk melihat log event langsung, grafik agregasi klik tombol aksi, dan pertumbuhan subscribers media sosial Anda.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 7. Call To Action Banner */}
      <RevealOnScroll>
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <div className="rounded-3xl bg-zinc-900 text-white p-8 sm:p-14 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Siap Memaksimalkan Konversi Website dan Media Sosial Anda?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Mulai gratis hari ini. Tanpa kartu kredit. Terhubung dengan website dan akun media sosial Anda dalam hitungan menit.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="px-6 py-3 rounded-xl bg-white text-zinc-900 font-bold text-xs sm:text-sm hover:bg-zinc-100 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <span>{user ? "Buka Dashboard Saya" : "Daftar Akun Baru — Gratis"}</span>
              </Link>
              <a
                href="#how-it-works"
                onClick={(e) => handleSmoothScroll(e, "how-it-works")}
                className="px-5 py-3 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs sm:text-sm hover:bg-zinc-700 transition-all border border-zinc-700 cursor-pointer active:scale-[0.98]"
              >
                <span>Lihat Alur Kerja</span>
              </a>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* 8. Modern Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-zinc-500">
            {/* Col 1: Brand Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 rounded-lg bg-zinc-900 text-white">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-base font-bold text-zinc-900 tracking-tight">
                  Firenalytics
                </span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
                Platform analitik konversi web CTA real-time dan pertumbuhan media sosial multisaluran berkinerja tinggi, ditenagai oleh Edge Computing Cloudflare Workers dan Next.js.
              </p>
            </div>

            {/* Col 2: Fitur & Solusi (Anchor Publik) */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                Fitur &amp; Solusi
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    onClick={(e) => handleSmoothScroll(e, "features")}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    Pelacakan Smart CTA
                  </a>
                </li>
                <li>
                  <a
                    href="#social"
                    onClick={(e) => handleSmoothScroll(e, "social")}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    Integrasi Media Sosial
                  </a>
                </li>
                <li>
                  <a
                    href="#workspace"
                    onClick={(e) => handleSmoothScroll(e, "workspace")}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    Workspace &amp; Tim (RBAC)
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => handleSmoothScroll(e, "how-it-works")}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    Alur 3 Langkah Pemasangan
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Akses Akun & Legal */}
            <div className="space-y-2.5">
              <div className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                Akses &amp; Legal
              </div>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="hover:text-zinc-900 transition-colors">
                    Masuk Akun
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-zinc-900 transition-colors">
                    Daftar Akun Baru
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-zinc-900 transition-colors">
                    Syarat &amp; Ketentuan
                  </Link>
                </li>
                <li>
                  <a href="mailto:nakadaalpha@gmail.com" className="hover:text-zinc-900 transition-colors">
                    Kontak: nakadaalpha@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div>
              &copy; {new Date().getFullYear()} Firenalytics. Seluruh hak cipta dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <span>Next.js 16</span>
              <span>&bull;</span>
              <span>Cloudflare Workers</span>
              <span>&bull;</span>
              <span>D1 SQLite Database</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
