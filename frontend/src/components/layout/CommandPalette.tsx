'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/context/CommandPaletteContext';
import { useProject } from '@/context/ProjectContext';
import {
  Search,
  Command,
  BarChart3,
  FileText,
  Share2,
  PlaySquare,
  MessageSquare,
  Layers,
  Code2,
  Building2,
  Download,
  Plus,
  Globe,
  Check,
  ArrowRight,
  CornerDownLeft,
  X,
  Sparkles,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'Navigasi Halaman' | 'Aksi Cepat' | 'Ganti Workspace';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  keywords?: string[];
  action: () => void;
  badge?: string;
  isActive?: boolean;
}

export function CommandPalette() {
  const { isOpen, closeCommandPalette } = useCommandPalette();
  const { currentProject, projects, selectProject } = useProject();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Construct complete list of available actions
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [
      // Category 1: Navigasi Halaman
      {
        id: 'nav-dashboard',
        category: 'Navigasi Halaman',
        title: 'Ringkasan Metrik (Web Analytics)',
        subtitle: 'Lihat tren klik CTA, rasio konversi (CTR), geo, dan perangkat',
        icon: BarChart3,
        keywords: ['traffic', 'web', 'overview', 'chart', 'kpi', 'analitik', 'beranda'],
        action: () => router.push('/dashboard'),
      },
      {
        id: 'nav-leads',
        category: 'Navigasi Halaman',
        title: 'Leads & Pesan Masuk (CRM Inbox)',
        subtitle: 'Kelola prospek masuk WhatsApp, Instagram DM, Kanban & 5-Column Table',
        icon: MessageSquare,
        keywords: ['leads', 'crm', 'kanban', 'chat', 'dm', 'whatsapp', 'pesan', 'closing', 'follow-up'],
        action: () => router.push('/dashboard/leads'),
      },
      {
        id: 'nav-social',
        category: 'Navigasi Halaman',
        title: 'Analitik Media Sosial & AI Sentimen',
        subtitle: 'Performa YouTube, TikTok, Instagram, AI Sentiment, dan Link-in-Bio',
        icon: Share2,
        keywords: ['social', 'media', 'instagram', 'tiktok', 'youtube', 'sentimen', 'ai', 'followers'],
        action: () => router.push('/dashboard/social'),
      },
      {
        id: 'nav-posts',
        category: 'Navigasi Halaman',
        title: 'Katalog Konten & Postingan Video',
        subtitle: 'Inspeksi seluruh konten video/gambar dengan Cloudflare R2 Media Proxy',
        icon: PlaySquare,
        keywords: ['posts', 'reels', 'shorts', 'video', 'feed', 'konten', 'r2', 'thumbnail'],
        action: () => router.push('/dashboard/social/posts'),
      },
      {
        id: 'nav-events',
        category: 'Navigasi Halaman',
        title: 'Event Logs & Element Aliases',
        subtitle: 'Log stream event klik real-time dan kelola alias elemen CTA',
        icon: FileText,
        keywords: ['events', 'logs', 'stream', 'alias', 'selector', 'cta'],
        action: () => router.push('/dashboard/events'),
      },
      {
        id: 'nav-projects',
        category: 'Navigasi Halaman',
        title: 'Manajemen Workspace & RBAC',
        subtitle: 'Pengaturan brand, domain whitelisting, API keys, dan hak akses tim',
        icon: Layers,
        keywords: ['workspace', 'project', 'brand', 'rbac', 'members', 'api key', 'whitelist'],
        action: () => router.push('/dashboard/projects'),
      },
      {
        id: 'nav-docs',
        category: 'Navigasi Halaman',
        title: 'Integrasi & Dokumentasi Tracker',
        subtitle: 'Panduan pemasangan tracker.js (React, Next.js, HTML, WordPress) dan REST API',
        icon: Code2,
        keywords: ['docs', 'api', 'tracker', 'snippet', 'code', 'panduan', 'integrasi'],
        action: () => router.push('/dashboard/projects'),
      },

      // Category 2: Aksi Cepat Operasional
      {
        id: 'act-export-leads',
        category: 'Aksi Cepat',
        title: 'Ekspor Prospek CRM ke CSV',
        subtitle: 'Buka halaman CRM untuk mengunduh 13-kolom data prospek terstandarisasi',
        icon: Download,
        keywords: ['export', 'csv', 'unduh', 'download', 'excel', 'leads'],
        badge: 'CRM CSV',
        action: () => {
          router.push('/dashboard/leads');
        },
      },
      {
        id: 'act-new-workspace',
        category: 'Aksi Cepat',
        title: 'Buat / Kelola Workspace Baru',
        subtitle: 'Buka dialog manajemen brand dan proyek baru',
        icon: Plus,
        keywords: ['create', 'new', 'tambah', 'workspace', 'brand'],
        action: () => router.push('/dashboard/projects'),
      },
      {
        id: 'act-link-website',
        category: 'Aksi Cepat',
        title: 'Hubungkan Domain Website',
        subtitle: 'Daftarkan domain website ke workspace aktif untuk mengaktifkan web tracker',
        icon: Globe,
        keywords: ['website', 'domain', 'hubungkan', 'link', 'origin'],
        action: () => router.push('/dashboard/projects'),
      },
      {
        id: 'act-sync-social',
        category: 'Aksi Cepat',
        title: 'Sinkronkan Data Media Sosial',
        subtitle: 'Buka halaman Analitik Media Sosial untuk menarik performa postingan terbaru',
        icon: Sparkles,
        keywords: ['sync', 'tarik', 'refresh', 'social', 'update'],
        action: () => router.push('/dashboard/social'),
      },
    ];

    // Category 3: Ganti Workspace Dinamis
    if (projects && projects.length > 0) {
      projects.forEach((p) => {
        const isCurrent = p.id === currentProject?.id;
        items.push({
          id: `ws-${p.id}`,
          category: 'Ganti Workspace',
          title: `Ganti ke Workspace: ${p.name}`,
          subtitle: p.allowedOrigins && p.allowedOrigins.length > 0
            ? `Domain: ${p.allowedOrigins.join(', ')}`
            : 'Workspace Mode: Social Media & Leads CRM',
          icon: Building2,
          keywords: ['workspace', 'switch', 'brand', 'ganti', p.name.toLowerCase()],
          isActive: isCurrent,
          badge: isCurrent ? 'Aktif' : undefined,
          action: () => {
            selectProject(p.id);
          },
        });
      });
    }

    return items;
  }, [router, projects, currentProject, selectProject]);

  // Filter items based on user search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const lowerQuery = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = item.subtitle.toLowerCase().includes(lowerQuery);
      const matchCategory = item.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [allItems, query]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('[data-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation inside dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        selectedItem.action();
        closeCommandPalette();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeCommandPalette}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400 shrink-0 ml-1 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama halaman, aksi, atau brand workspace..."
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Action List Area */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-50">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-zinc-700">Tidak ada aksi yang cocok</div>
              <div className="text-xs text-zinc-400 mt-1">Coba gunakan kata kunci lain seperti &quot;leads&quot;, &quot;social&quot;, atau &quot;workspace&quot;</div>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => {
                    item.action();
                    closeCommandPalette();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-white border-zinc-300 text-zinc-900 shadow-2xs'
                          : 'bg-zinc-100 border-zinc-200/80 text-zinc-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate text-zinc-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60 shrink-0">
                          {item.category}
                        </span>
                        {item.isActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Aktif
                          </span>
                        )}
                        {item.badge && !item.isActive && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                        <span className="hidden sm:inline">Pilih</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">↓</kbd>
              <span>Navigasi</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">↵</kbd>
              <span>Buka</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">ESC</kbd>
              <span>Tutup</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-zinc-400 font-mono text-[10px]">
            <Command className="w-3 h-3" />
            <span>K untuk Buka / Tutup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
