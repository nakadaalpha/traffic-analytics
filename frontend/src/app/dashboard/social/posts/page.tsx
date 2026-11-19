'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { 
  ArrowUpDown, 
  RotateCw, 
  RefreshCw,
  Loader2,
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Search, 
  PlaySquare, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
  Play,
  Maximize2,
  Film,
  X
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------
export interface SocialPost {
  id: string;
  connectionId: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook';
  platformPostId: string;
  titleOrCaption: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  publishedAt: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  accountHandle?: string | null;
  additionalMetrics?: {
    media_type?: string;
    duration?: string;
    engagement_rate?: string;
  };
}

export interface PostComment {
  id: string;
  author: string;
  username?: string;
  text: string;
  likeCount: number;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface PostSentimentInfo {
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  positiveRatio: string;
}

export interface PostsSummary {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: string;
}

export interface SocialConnection {
  id: string;
  platform: string;
  accountHandle?: string | null;
  accountLabel?: string | null;
  status: string;
}

const SUPPORTED_PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-200',
    iconSvg: (
      <svg className="w-4 h-4 fill-red-600" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    badgeColor: 'bg-zinc-900/10 text-zinc-900 border-zinc-200',
    iconSvg: (
      <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.88-4.47V8.58a8.28 8.28 0 0 0 4.84 1.56V6.69h-.95z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badgeColor: 'bg-pink-500/10 text-pink-600 border-pink-200',
    iconSvg: (
      <svg className="w-4 h-4 fill-pink-600" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    badgeColor: 'bg-blue-600/10 text-blue-600 border-blue-200',
    iconSvg: (
      <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

/**
 * Memeriksa apakah URL CDN Instagram (&oe=...) telah kedaluwarsa secara deterministik.
 * Nilai parameter oe adalah timestamp unix detik dalam format hexadecimal.
 */
function isInstagramUrlExpired(url: string | null | undefined): boolean {
  if (!url) return true;
  const match = url.match(/[?&]oe=([0-9a-fA-F]+)/);
  if (!match) return false;
  try {
    const expSec = parseInt(match[1], 16);
    const nowSec = Math.floor(Date.now() / 1000);
    return expSec <= nowSec;
  } catch {
    return false;
  }
}

/**
 * Filter data postingan berdasarkan periode tanggal terbit (publishedAt)
 * Mendukung 'all', '24h', '7d', '30d', 'this_month', 'last_month', dan 'custom'.
 */
function isPostInPeriod(
  publishedAt: string | null | undefined,
  period: string,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!period || period === 'all') return true;
  if (!publishedAt) return false;

  try {
    const postTime = new Date(publishedAt).getTime();
    if (isNaN(postTime)) return false;
    const now = Date.now();

    if (period === '24h') {
      return postTime >= now - 24 * 60 * 60 * 1000 && postTime <= now;
    }
    if (period === '7d') {
      return postTime >= now - 7 * 24 * 60 * 60 * 1000 && postTime <= now;
    }
    if (period === '30d') {
      return postTime >= now - 30 * 24 * 60 * 60 * 1000 && postTime <= now;
    }
    if (period === 'this_month') {
      const nowDate = new Date();
      const startMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0, 0).getTime();
      return postTime >= startMonth && postTime <= now;
    }
    if (period === 'last_month') {
      const nowDate = new Date();
      const prevMonthStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
      const prevMonthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0, 23, 59, 59, 999).getTime();
      return postTime >= prevMonthStart && postTime <= prevMonthEnd;
    }
    if (period === 'custom') {
      if (customStart) {
        const startTime = new Date(`${customStart}T00:00:00`).getTime();
        if (postTime < startTime) return false;
      }
      if (customEnd) {
        const endTime = new Date(`${customEnd}T23:59:59`).getTime();
        if (postTime > endTime) return false;
      }
      return true;
    }
  } catch {
    return true;
  }
  return true;
}

// -------------------------------------------------------------
// Component: Defensive Post Thumbnail with Seamless Zero-Click Mirroring & Shimmer Placeholder
// -------------------------------------------------------------
function PostThumbnail({ 
  post, 
  platformObj,
  onThumbnailUpdated,
  onPreview,
}: { 
  post: SocialPost; 
  platformObj: any;
  onThumbnailUpdated?: (postId: string, newUrl: string) => void;
  onPreview?: (post: SocialPost, currentUrl: string | null) => void;
}) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(post.thumbnailUrl);
  const [hasError, setHasError] = useState(false);
  const [isAutoHealing, setIsAutoHealing] = useState(false);
  const autoHealAttempted = React.useRef(false);

  useEffect(() => {
    setCurrentUrl(post.thumbnailUrl);
    setHasError(false);
  }, [post.thumbnailUrl]);

  // Cek apakah URL Instagram kadaluarsa secara deterministik (&oe=...)
  const isExpired = post.platform === 'instagram' && isInstagramUrlExpired(currentUrl);

  // Silent Auto-Heal: Jika URL kedaluwarsa atau terjadi image error, minta backend mirror ke R2 secara otomatis
  useEffect(() => {
    if ((isExpired || hasError) && !isAutoHealing && !autoHealAttempted.current) {
      autoHealAttempted.current = true;
      setIsAutoHealing(true);

      fetch(`/api/composio/posts/${encodeURIComponent(post.id)}/refresh-thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.thumbnailUrl) {
            setCurrentUrl(data.thumbnailUrl);
            setHasError(false);
            if (onThumbnailUpdated) {
              onThumbnailUpdated(post.id, data.thumbnailUrl);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsAutoHealing(false);
        });
    }
  }, [isExpired, hasError, isAutoHealing, post.id, onThumbnailUpdated]);

  // State: Sedang dalam proses auto-healing di latar belakang -> Tampilkan Shimmer Elegan
  if (isAutoHealing) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-zinc-900/90 aspect-[3/4] p-3.5 flex flex-col justify-between border border-zinc-800 animate-pulse text-left">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-zinc-300 flex items-center gap-1 border border-white/10">
            {platformObj?.iconSvg}
            <span className="capitalize">{post.platform}</span>
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-medium">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>Memuat...</span>
          </span>
        </div>
        <div className="space-y-2 my-auto px-1">
          <div className="h-2.5 bg-zinc-800 rounded w-4/5"></div>
          <div className="h-2.5 bg-zinc-800 rounded w-3/5"></div>
        </div>
        <div className="h-6 bg-zinc-800/80 rounded w-full"></div>
      </div>
    );
  }

  // Jika URL benar-benar kosong atau gagal permanen setelah auto-heal
  if (!currentUrl || (hasError && autoHealAttempted.current)) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 aspect-[3/4] p-3.5 flex flex-col justify-between border border-zinc-800 group/thumb text-left">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-zinc-300 backdrop-blur-xs flex items-center gap-1 border border-white/10">
            {platformObj?.iconSvg}
            <span className="capitalize">{post.platform}</span>
          </span>
        </div>

        <div className="space-y-1.5 my-auto">
          <p className="text-xs text-zinc-300 line-clamp-4 leading-relaxed font-normal italic">
            "{post.titleOrCaption || 'Tidak ada keterangan caption'}"
          </p>
        </div>

        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors border border-white/10"
          >
            <span>Buka di {post.platform === 'instagram' ? 'Instagram' : 'Platform'}</span>
            <ExternalLink className="w-3 h-3 text-zinc-300" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => onPreview?.(post, currentUrl)}
      className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[3/4] group/thumb cursor-pointer select-none"
      title="Klik untuk menonton / pratinjau media di aplikasi"
    >
      {currentUrl.includes('.mp4') ? (
        <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-3 text-center relative overflow-hidden group/vid">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-2 shadow-lg group-hover/thumb:scale-110 group-hover/thumb:bg-indigo-600 transition-all duration-300">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
          
          <span className="text-[11px] font-medium text-zinc-300 line-clamp-2 px-1 relative z-10">
            {post.titleOrCaption || 'Putar Pratinjau Video'}
          </span>
          
          <span className="mt-1.5 text-[9px] uppercase font-bold tracking-wider text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded-full border border-indigo-500/30">
            Video MP4
          </span>
        </div>
      ) : (
        <img
          src={currentUrl}
          alt={post.titleOrCaption ? `Thumbnail postingan: ${post.titleOrCaption.slice(0, 60)}` : `Thumbnail konten ${post.platform}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Hover Overlay Play Icon (for images) */}
      {!currentUrl.includes('.mp4') && (
        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg opacity-0 group-hover/thumb:opacity-100 transform scale-90 group-hover/thumb:scale-100 transition-all duration-200">
            <Play className="w-4 h-4 ml-0.5 fill-current" />
          </div>
        </div>
      )}

      {post.additionalMetrics?.duration && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-mono font-semibold text-white">
          {post.additionalMetrics.duration}
        </span>
      )}
      {post.additionalMetrics?.media_type && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-semibold text-white uppercase">
          {post.additionalMetrics.media_type}
        </span>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: Reusable Pagination Bar (Top & Bottom Sandwich)
// -------------------------------------------------------------
function PaginationBar({
  position,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  onNavigateTop,
}: {
  position: 'top' | 'bottom';
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  onNavigateTop?: () => void;
}) {
  return (
    <div
      className={`${
        position === 'top'
          ? 'border-b border-zinc-200/90 bg-zinc-50/40'
          : 'border-t border-zinc-200 bg-white'
      } px-5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}
    >
      {/* Kiri: Ringkasan Data */}
      <div className="text-zinc-500 font-medium text-center sm:text-left">
        Menampilkan{' '}
        <span className="font-semibold text-zinc-900">
          {totalItems === 0 ? 0 : startIndex + 1}
        </span>{' '}
        -{' '}
        <span className="font-semibold text-zinc-900">{endIndex}</span> dari{' '}
        <span className="font-semibold text-zinc-900">{totalItems}</span> konten
      </div>

      {/* Kanan: Pilihan Konten per Halaman & Navigasi Halaman */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[11px] whitespace-nowrap">
            Konten per halaman:
          </span>
          <select
            value={itemsPerPage}
            aria-label="Konten per halaman"
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
              if (position === 'bottom') {
                onNavigateTop?.();
              }
            }}
            className="text-xs font-semibold px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer shadow-2xs transition-colors"
          >
            <option value={12}>12 (3 baris)</option>
            <option value={24}>24 (6 baris)</option>
            <option value={48}>48 (12 baris)</option>
            <option value={96}>96 (24 baris)</option>
          </select>
        </div>

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              if (position === 'bottom') {
                onNavigateTop?.();
              }
            }}
            disabled={currentPage <= 1}
            aria-label="Halaman Sebelumnya"
            className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-md border border-zinc-200/80">
            Hal {currentPage} dari {totalPages}
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              if (position === 'bottom') {
                onNavigateTop?.();
              }
            }}
            disabled={currentPage >= totalPages}
            aria-label="Halaman Berikutnya"
            className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Halaman Berikutnya"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SocialPostsPage() {
  const { currentProject } = useProject();

  const catalogContainerRef = useRef<HTMLDivElement>(null);

  const scrollToCatalogTop = () => {
    if (catalogContainerRef.current) {
      const yOffset = -80; // 64px header + 16px buffer
      const y = catalogContainerRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }, []);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [postsSummary, setPostsSummary] = useState<PostsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleThumbnailUpdated = useCallback((postId: string, newUrl: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, thumbnailUrl: newUrl } : p)));
  }, []);

  // Filters & Search
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'recent'>('recent');

  // Cooldown timestamp ref untuk tombol Manual Sync
  const lastSyncTimeRef = useRef<number>(0);

  // Client-Side Grid Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Auto-reset ke Halaman 1 saat filter, pencarian, periode, atau sorting berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [platformFilter, selectedConnectionId, periodFilter, customStartDate, customEndDate, searchQuery, sortBy]);

  // Modal Komentar Masuk
  const [mounted, setMounted] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<SocialPost | null>(null);
  const [activeSentiment, setActiveSentiment] = useState<PostSentimentInfo | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [commentsList, setCommentsList] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Modal In-App Video & Media Preview (Pilar C)
  const [selectedPreviewPost, setSelectedPreviewPost] = useState<{
    post: SocialPost;
    mediaUrl: string | null;
  } | null>(null);
  const [previewMediaError, setPreviewMediaError] = useState(false);

  useEffect(() => {
    setPreviewMediaError(false);
  }, [selectedPreviewPost?.post.id]);

  // Keyboard listener ESC untuk menutup modal video preview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedPreviewPost) {
        setSelectedPreviewPost(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPreviewPost]);

  // Notifikasi
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  }, []);

  // Format Helper Waktu Lokal (WIB / UTC+7)
  const formatLocalDate = useCallback((dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '-';
    try {
      const normalizedStr = dateStr.includes('T')
        ? dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`
        : `${dateStr.replace(' ', 'T')}Z`;
      const date = new Date(normalizedStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', options || {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  }, []);

  // 1. Fetch Connections List
  const fetchConnections = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentProject?.id) params.set('projectId', currentProject.id);

      const res = await fetch(`/api/composio/metrics?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.connections)) {
        setConnections(data.connections);
      }
    } catch (e: any) {
      console.warn('Gagal memuat daftar koneksi:', e.message);
    }
  }, [currentProject?.id, getAuthHeaders]);

  // 2. Fetch Posts (Single Fetch per Workspace, 0-hit saat ganti filter/periode)
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentProject?.id) {
        params.append('projectId', currentProject.id);
      }

      const res = await fetch(`/api/composio/posts?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));

      if (json.success) {
        const fetchedPosts: SocialPost[] = json.posts || [];
        setPosts(fetchedPosts);
        setPostsSummary(json.summary || null);

        // Ekstrak koneksi unik langsung dari daftar postingan jika belum tersedia
        setConnections((prev) => {
          if (prev.length > 0) return prev;
          const map = new Map<string, SocialConnection>();
          for (const p of fetchedPosts) {
            if (p.connectionId && !map.has(p.connectionId)) {
              map.set(p.connectionId, {
                id: p.connectionId,
                platform: p.platform,
                accountHandle: p.accountHandle || null,
                accountLabel: (p as any).accountLabel || null,
                status: 'ACTIVE',
              });
            }
          }
          return Array.from(map.values());
        });

        // Silent Background Batch Auto-Heal: Perbarui dan simpan gambar kedaluwarsa ke Cloudflare R2 secara otomatis
        const expiredPosts = fetchedPosts.filter(
          (p) => p.platform === 'instagram' && p.thumbnailUrl && isInstagramUrlExpired(p.thumbnailUrl)
        );
        if (expiredPosts.length > 0) {
          const postIdsToHeal = expiredPosts.slice(0, 30).map((p) => p.id);
          fetch('/api/composio/posts/refresh-thumbnails-batch', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ postIds: postIdsToHeal }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.updatedMap && Object.keys(data.updatedMap).length > 0) {
                setPosts((prev) =>
                  prev.map((p) => (data.updatedMap[p.id] ? { ...p, thumbnailUrl: data.updatedMap[p.id] } : p))
                );
              }
            })
            .catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat data postingan:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, getAuthHeaders]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 3. Handle Manual Sync Konten dengan penanganan defensif & perlindungan cooldown 15 detik
  const handleManualSync = async () => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 15000) {
      const waitSec = Math.ceil((15000 - (now - lastSyncTimeRef.current)) / 1000);
      showNotification('error', `Mohon tunggu ${waitSec} detik sebelum memicu sinkronisasi konten baru.`);
      return;
    }
    lastSyncTimeRef.current = now;

    try {
      setIsSyncing(true);
      setNotification(null);
      const payload: any = { force: true };
      if (currentProject?.id) payload.projectId = currentProject.id;
      if (selectedConnectionId && selectedConnectionId !== 'all') {
        payload.connectionId = selectedConnectionId;
      }

      const res = await fetch('/api/composio/posts/sync', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = {
          error:
            res.status === 504
              ? 'Proses sinkronisasi media sosial membutuhkan waktu lebih lama dan sedang dilanjutkan di latar belakang.'
              : res.status === 502
              ? 'Server backend sedang memulai ulang. Silakan coba kembali dalam beberapa saat.'
              : res.status === 401
              ? 'Sesi login telah kedaluwarsa. Silakan muat ulang halaman atau masuk kembali.'
              : `Gagal menyinkronkan postingan (Status HTTP ${res.status}).`,
        };
      }

      if (res.ok && json?.success) {
        showNotification('success', json.message || 'Sinkronisasi postingan & video berhasil diperbarui!');
        await fetchPosts();
      } else {
        const errorMsg = json?.error || (res.status === 404 ? 'Tidak ditemukan akun aktif di workspace ini.' : 'Gagal menyinkronkan postingan');
        showNotification('error', errorMsg);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Terjadi kesalahan jaringan saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Modal Komentar
  const openCommentsModal = useCallback(async (post: SocialPost) => {
    setActiveCommentsPost(post);
    setActiveSentiment(null);
    setSentimentFilter('all');
    setCommentsLoading(true);
    setCommentsError(null);
    setCommentsList([]);

    try {
      const res = await fetch(`/api/composio/posts/${post.id}/comments`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setCommentsList(json.comments || []);
        if (json.sentiment) {
          setActiveSentiment(json.sentiment);
        }
      } else {
        setCommentsError(json.error || 'Gagal memuat komentar publik');
      }
    } catch (e: any) {
      setCommentsError('Gangguan jaringan saat memuat komentar');
    } finally {
      setCommentsLoading(false);
    }
  }, [getAuthHeaders]);

  // Filtered Posts berdasarkan Platform, Akun, Periode, Search Query, dan Sorting (Zero-Hit In-Memory Slicing)
  const filteredPosts = useMemo(() => {
    let result = posts;

    // 1. Filter Platform
    if (platformFilter && platformFilter !== 'all') {
      result = result.filter((p) => p.platform?.toLowerCase() === platformFilter.toLowerCase());
    }

    // 2. Filter Akun / Koneksi
    if (selectedConnectionId && selectedConnectionId !== 'all') {
      result = result.filter((p) => p.connectionId === selectedConnectionId);
    }

    // 3. Filter Periode Tanggal Terbit Konten
    if (periodFilter && periodFilter !== 'all') {
      result = result.filter((p) => isPostInPeriod(p.publishedAt, periodFilter, customStartDate, customEndDate));
    }

    // 4. Filter Pencarian Teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.titleOrCaption || '').toLowerCase().includes(q) ||
          (p.accountHandle || '').toLowerCase().includes(q) ||
          (p.platform || '').toLowerCase().includes(q)
      );
    }

    // 5. Sorting
    if (sortBy === 'views') {
      result = [...result].sort((a, b) => (Number(b.viewsCount) || 0) - (Number(a.viewsCount) || 0));
    } else if (sortBy === 'likes') {
      result = [...result].sort((a, b) => (Number(b.likesCount) || 0) - (Number(a.likesCount) || 0));
    } else if (sortBy === 'comments') {
      result = [...result].sort((a, b) => (Number(b.commentsCount) || 0) - (Number(a.commentsCount) || 0));
    } else {
      // 'recent'
      result = [...result].sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    }

    return result;
  }, [posts, platformFilter, selectedConnectionId, periodFilter, customStartDate, customEndDate, searchQuery, sortBy]);

  // Dynamic Summary Recalculation (Kalkulasi instan 6 KPI Card berdasarkan subset yang terfilter)
  const dynamicSummary = useMemo(() => {
    const totalPosts = filteredPosts.length;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    for (const p of filteredPosts) {
      totalViews += Number(p.viewsCount || 0);
      totalLikes += Number(p.likesCount || 0);
      totalComments += Number(p.commentsCount || 0);
      totalShares += Number(p.sharesCount || 0);
    }

    const totalInteractions = totalLikes + totalComments;
    const avgEngagementRate =
      totalViews > 0 ? `${((totalInteractions / totalViews) * 100).toFixed(1)}%` : '0.0%';

    return {
      totalPosts,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalInteractions,
      avgEngagementRate,
    };
  }, [filteredPosts]);

  // Client-Side Grid Pagination Calculations
  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPosts = useMemo(() => {
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, startIndex, endIndex]);

  // Filtered Comments berdasarkan Sentiment Tab
  const filteredComments = useMemo(() => {
    if (sentimentFilter === 'all') return commentsList;
    return commentsList.filter((c) => c.sentiment === sentimentFilter);
  }, [commentsList, sentimentFilter]);

  // Available connections for current platform tab
  const availableConnections = useMemo(() => {
    if (platformFilter === 'all') return connections;
    return connections.filter((c) => c.platform.toLowerCase() === platformFilter.toLowerCase());
  }, [connections, platformFilter]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <Link href="/dashboard/social" className="hover:text-zinc-900 transition-colors">
              Analitik Media Sosial
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-900">Konten & Postingan</span>
          </div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <PlaySquare className="w-6 h-6 text-indigo-600" />
            <span>Katalog Konten & Postingan</span>
          </h1>
          <p className="text-xs text-zinc-500">
            Eksplorasi mendalam metrik performa video, postingan, likes, dan komentar di seluruh platform media sosial yang terhubung.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            title="Segarkan data konten secara langsung dari API resmi"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Konten'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-medium leading-relaxed">
            {notification.message}
            {notification.type === 'error' && (
              notification.message.includes('hubungkan ulang') ||
              notification.message.includes('Manajemen & Integrasi') ||
              notification.message.includes('kedaluwarsa')
            ) && (
              <div className="mt-2">
                <Link
                  href="/dashboard/projects"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-900 font-semibold transition-colors"
                >
                  <span>Buka Menu Manajemen & Integrasi untuk Hubungkan Ulang</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Tutup notifikasi"
            className="text-xs text-zinc-400 hover:text-zinc-600 font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Ringkasan Konten (Reaktif Dinamis terhadap Filter & Periode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Konten */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Konten Terpantau</span>
            <PlaySquare className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {loading ? '...' : dynamicSummary.totalPosts.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{periodFilter === 'all' ? 'Video & postingan resmi' : `Konten rilis ${periodFilter.replace('_', ' ')}`}</span>
          </div>
        </div>

        {/* Total Penayangan */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Penayangan (Views)</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {loading ? '...' : dynamicSummary.totalViews.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            Akumulasi pemutaran konten
          </div>
        </div>

        {/* Total Likes & Komentar */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Interaksi</span>
            <ThumbsUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {loading ? '...' : dynamicSummary.totalInteractions.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            {dynamicSummary.totalLikes.toLocaleString('id-ID')} likes, {dynamicSummary.totalComments.toLocaleString('id-ID')} komentar
          </div>
        </div>

        {/* Rata-rata Engagement Rate */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Avg Engagement Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
            {loading ? '...' : dynamicSummary.avgEngagementRate}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            Rasio likes & komentar per views
          </div>
        </div>
      </div>

      {/* Main Content Browser Card */}
      <div ref={catalogContainerRef} className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar Bar: Tabs, Account Switcher, Search, Sort */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/60 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Segmented Platform Tabs */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-2xs overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Semua Platform' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'instagram', label: 'Instagram' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'facebook', label: 'Facebook' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPlatformFilter(tab.id);
                    setSelectedConnectionId('all'); // Reset connection filter to prevent cross-platform lock
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    platformFilter === tab.id
                      ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Account Selector (Jika ada beberapa akun) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Filter Akun:</span>
              <select
                value={selectedConnectionId}
                aria-label="Filter Akun Media Sosial"
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
              >
                <option value="all">Semua Akun ({currentProject?.name || 'Workspace'})</option>
                {availableConnections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.platform.toUpperCase()}: {c.accountHandle || 'Akun Terhubung'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar, Periode Filter & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari caption, judul video, handle pengunggah..."
                aria-label="Cari caption atau konten postingan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800 placeholder-zinc-400 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Periode Rilis Konten */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Periode:
                </span>
                <select
                  value={periodFilter}
                  aria-label="Filter Periode Konten"
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="24h">24 Jam Terakhir</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="last_month">Bulan Lalu</option>
                  <option value="custom">Rentang Kustom...</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Urutkan:
                </span>
                <select
                  value={sortBy}
                  aria-label="Urutkan Konten Postingan"
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
                >
                  <option value="recent">Tanggal Rilis Terbaru</option>
                  <option value="views">Penayangan Terbanyak (Views)</option>
                  <option value="likes">Paling Disukai (Likes)</option>
                  <option value="comments">Komentar Terbanyak (Comments)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-bar Tanggal Kustom jika periode 'custom' terpilih */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60 text-xs flex-wrap">
              <span className="text-zinc-500 font-medium">Dari Tanggal:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs"
              />
              <span className="text-zinc-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs"
              />
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-900 font-medium cursor-pointer underline"
                >
                  Reset Tanggal
                </button>
              )}
            </div>
          )}

          {/* Active Filter Helper Strip */}
          {(platformFilter !== 'all' || selectedConnectionId !== 'all' || periodFilter !== 'all' || searchQuery.trim()) && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400 text-[11px]">Filter aktif:</span>
                {platformFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 text-[11px] font-medium flex items-center gap-1">
                    Platform: <strong className="capitalize">{platformFilter}</strong>
                    <button type="button" onClick={() => setPlatformFilter('all')} className="hover:text-red-600">✕</button>
                  </span>
                )}
                {selectedConnectionId !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 text-[11px] font-medium flex items-center gap-1">
                    Akun spesifik
                    <button type="button" onClick={() => setSelectedConnectionId('all')} className="hover:text-red-600">✕</button>
                  </span>
                )}
                {periodFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium flex items-center gap-1">
                    Periode: <strong>{periodFilter === 'custom' ? `${customStartDate || 'Awal'} - ${customEndDate || 'Sekarang'}` : periodFilter.replace('_', ' ')}</strong>
                    <button type="button" onClick={() => { setPeriodFilter('all'); setCustomStartDate(''); setCustomEndDate(''); }} className="hover:text-red-600">✕</button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 text-[11px] font-medium flex items-center gap-1">
                    Cari: &ldquo;{searchQuery}&rdquo;
                    <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-600">✕</button>
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 pl-1">
                  ({filteredPosts.length} dari {posts.length} konten)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlatformFilter('all');
                  setSelectedConnectionId('all');
                  setPeriodFilter('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer whitespace-nowrap"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>

        {/* Top Pagination Toolbar (Sandwich Header) */}
        {!loading && filteredPosts.length > 0 && (
          <PaginationBar
            position="top"
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            currentPage={validCurrentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            onNavigateTop={scrollToCatalogTop}
          />
        )}

        {/* Content Cards Grid */}
        <div className="p-5">
          {loading ? (
            <div className="p-16 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
              <RotateCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Memuat seluruh performa konten & video...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 text-center text-xs text-zinc-400 space-y-3">
              <p className="font-semibold text-zinc-600">Tidak ada konten yang sesuai dengan filter.</p>
              <p>Coba pilih tab platform lain atau segarkan sinkronisasi media sosial Anda.</p>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkronisasi Ulang Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedPosts.map((post) => {
                const platformObj = SUPPORTED_PLATFORMS.find((p) => p.id === post.platform);
                return (
                  <div
                    key={post.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-3">
                      {/* Header Card: Platform Badge + Waktu Rilis */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border shrink-0 ${platformObj?.badgeColor || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                            {platformObj?.iconSvg}
                            <span className="capitalize">{post.platform}</span>
                          </span>
                          {post.accountHandle && (
                            <span className="text-[10px] font-semibold text-zinc-500 font-mono truncate max-w-[100px]" title={post.accountHandle}>
                              {post.accountHandle}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                          {formatLocalDate(post.publishedAt)}
                        </span>
                      </div>

                      {/* Preview Thumbnail / Media Container (Defensive Anti-Black Box & On-Demand Refresh) */}
                      <PostThumbnail 
                        post={post} 
                        platformObj={platformObj} 
                        onThumbnailUpdated={handleThumbnailUpdated} 
                        onPreview={(p, url) => setSelectedPreviewPost({ post: p, mediaUrl: url })}
                      />

                      {/* Title / Caption */}
                      {post.titleOrCaption && (
                        <h3
                          className="font-bold text-xs text-zinc-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer"
                          title={post.titleOrCaption}
                          onClick={() => setSelectedPreviewPost({ post, mediaUrl: post.thumbnailUrl })}
                        >
                          {post.titleOrCaption}
                        </h3>
                      )}

                      {/* 3 Metrik Utama (Views, Likes, Comments) */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-zinc-50/80 border border-zinc-100 text-center">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <Eye className="w-3 h-3 text-sky-500" />
                            <span>Views</span>
                          </div>
                          <div className="font-bold text-xs text-zinc-900 font-mono">
                            {Number(post.viewsCount).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <div className="space-y-0.5 border-x border-zinc-200/60">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <ThumbsUp className="w-3 h-3 text-rose-500" />
                            <span>Likes</span>
                          </div>
                          <div className="font-bold text-xs text-zinc-900 font-mono">
                            {Number(post.likesCount).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openCommentsModal(post)}
                          aria-label={`Buka ${Number(post.commentsCount).toLocaleString('id-ID')} komentar postingan`}
                          className="space-y-0.5 hover:bg-zinc-100/60 rounded transition-colors cursor-pointer"
                          title="Klik untuk melihat komentar publik"
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <MessageCircle className="w-3 h-3 text-emerald-500" />
                            <span>Komentar</span>
                          </div>
                          <div className="font-bold text-xs text-zinc-900 font-mono underline decoration-dotted">
                            {Number(post.commentsCount).toLocaleString('id-ID')}
                          </div>
                        </button>
                      </div>

                      {/* Engagement Rate Pill */}
                      {post.additionalMetrics?.engagement_rate && (
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                          <span>Engagement Rate:</span>
                          <span className="font-bold text-emerald-600 font-mono">
                            {post.additionalMetrics.engagement_rate}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer Card Actions */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewPost({ post, mediaUrl: post.thumbnailUrl })}
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-indigo-600 font-semibold cursor-pointer transition-colors"
                        title="Tonton video atau pratinjau media di aplikasi"
                      >
                        <Play className="w-3 h-3 fill-current text-indigo-500" />
                        <span>Pratinjau</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCommentsModal(post)}
                        className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 font-medium cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Komentar ({post.commentsCount})</span>
                      </button>

                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-800 transition-colors"
                          title="Buka postingan langsung di platform"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Pagination Footer (Sandwich Footer) */}
        {!loading && filteredPosts.length > 0 && (
          <PaginationBar
            position="bottom"
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            currentPage={validCurrentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            onNavigateTop={scrollToCatalogTop}
          />
        )}
      </div>

      {/* Modal Interaktif Komentar Masuk & Sentimen AI (Portal) */}
      {mounted && activeCommentsPost && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-zinc-900 truncate">
                    Komentar Publik: {activeCommentsPost.titleOrCaption}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {activeCommentsPost.accountHandle || activeCommentsPost.platform}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCommentsPost(null)}
                aria-label="Tutup analisis komentar"
                className="w-7 h-7 rounded-lg hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* AI Sentiment Analysis Pill Bar */}
            {activeSentiment && (
              <div className="p-3 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium text-zinc-700">Analisis Sentimen:</span>
                  <span className="font-bold text-indigo-600">{activeSentiment.positiveRatio} Positif</span>
                </div>

                <div className="flex items-center gap-1">
                  {(['all', 'positive', 'neutral', 'negative'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSentimentFilter(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize cursor-pointer transition-colors ${
                        sentimentFilter === s
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {s === 'all' ? 'Semua' : s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List Komentar */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {commentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-400 gap-2">
                  <RotateCw className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Mengambil komentar terbaru...</span>
                </div>
              ) : commentsError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{commentsError}</span>
                </div>
              ) : filteredComments.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-600">Belum ada komentar</p>
                  <p>Tidak ada komentar publik yang ditemukan untuk postingan ini.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredComments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900">{c.author || c.username || 'Pengguna'}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{formatLocalDate(c.timestamp)}</span>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {c.text}
                      </p>
                      {c.likeCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold pt-0.5">
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>{c.likeCount} suka</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">Data komentar resmi API terverifikasi</span>
              {activeCommentsPost.permalink && (
                <a
                  href={activeCommentsPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Buka di {activeCommentsPost.platform}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal In-App Video & Media Preview (Pilar C) */}
      {mounted && selectedPreviewPost && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedPreviewPost(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sisi Kiri: Media Viewport / Native Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px] max-h-[55vh] md:max-h-[85vh] p-2">
              {previewMediaError ? (
                <div className="text-center p-8 text-zinc-400 text-xs space-y-2">
                  <Film className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="font-semibold text-zinc-300">Pratinjau media tidak dapat dimuat langsung</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Aset media dari platform menggunakan tautan berbatas waktu. Anda dapat memutarnya langsung di platform asli.
                  </p>
                  {selectedPreviewPost.post.permalink && (
                    <a
                      href={selectedPreviewPost.post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs mt-3 border border-zinc-700 transition-colors"
                    >
                      <span>Buka di {selectedPreviewPost.post.platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : selectedPreviewPost.mediaUrl?.includes('.mp4') ? (
                <video
                  src={selectedPreviewPost.mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setPreviewMediaError(true)}
                  className="w-full h-full max-h-[50vh] md:max-h-[80vh] object-contain rounded-lg"
                />
              ) : selectedPreviewPost.mediaUrl ? (
                <img
                  src={selectedPreviewPost.mediaUrl}
                  alt={selectedPreviewPost.post.titleOrCaption || 'Media preview'}
                  onError={() => setPreviewMediaError(true)}
                  className="w-full h-full max-h-[50vh] md:max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 text-zinc-500 text-xs">
                  <Film className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                  <span>Media streaming tidak tersedia</span>
                </div>
              )}

              {/* Badges di atas player */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/70 backdrop-blur-md border border-white/10 uppercase tracking-wider text-white">
                  {selectedPreviewPost.post.platform}
                </span>
                {selectedPreviewPost.post.additionalMetrics?.duration && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-mono font-semibold bg-black/70 backdrop-blur-md border border-white/10 text-white">
                    {selectedPreviewPost.post.additionalMetrics.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Sisi Kanan: Panel Rincian Konten & Metrik */}
            <div className="w-full md:w-88 p-5 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header Akun & Tutup Modal */}
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {selectedPreviewPost.post.accountHandle || `@${selectedPreviewPost.post.platform}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Dipublikasikan {formatLocalDate(selectedPreviewPost.post.publishedAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPreviewPost(null)}
                    aria-label="Tutup pratinjau media"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                    title="Tutup (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Caption Lengkap Tanpa Potong */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Keterangan / Caption
                  </span>
                  <div className="max-h-40 overflow-y-auto text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap pr-1 select-text">
                    {selectedPreviewPost.post.titleOrCaption || (
                      <span className="text-zinc-500 italic">Tidak ada keterangan teks</span>
                    )}
                  </div>
                </div>

                {/* Grid Metrik Performa 2x2 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Metrik Performa Riil
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Penayangan</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {Number(selectedPreviewPost.post.viewsCount).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                        <span>Suka</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {Number(selectedPreviewPost.post.likesCount).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Komentar</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {Number(selectedPreviewPost.post.commentsCount).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Engagement</span>
                      </div>
                      <div className="text-base font-bold font-mono text-white">
                        {selectedPreviewPost.post.additionalMetrics?.engagement_rate || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons di Footer Panel */}
              <div className="pt-4 border-t border-zinc-800 space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    const postToComment = selectedPreviewPost.post;
                    setSelectedPreviewPost(null);
                    openCommentsModal(postToComment);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Lihat Komentar &amp; Analisis Sentimen</span>
                </button>

                {selectedPreviewPost.post.permalink && (
                  <a
                    href={selectedPreviewPost.post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-zinc-700/60"
                  >
                    <span>Buka di {selectedPreviewPost.post.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
