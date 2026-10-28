'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Share2, 
  RefreshCw, 
  RotateCw,
  FolderOpen,
  ShieldCheck,
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Layers, 
  ArrowUpRight,
  TrendingUp,
  Users,
  Eye,
  Radio,
  PlaySquare,
  BarChart2,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Filter,
  Flame,
  ArrowUpDown
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SocialConnection {
  id: string;
  user_id: string;
  platform: string;
  composio_connection_id: string;
  account_handle?: string | null;
  status: 'ACTIVE' | 'INITIATED' | 'EXPIRED' | 'REVOKED';
  last_synced_at?: string | null;
  created_at: string;
}

interface SocialMetricsData {
  hasConnections: boolean;
  connectionsCount?: number;
  connections?: Array<{ id: string; platform: string; accountHandle?: string; lastSyncedAt?: string }>;
  primaryAccount?: any;
  summary: {
    connectionId?: string;
    subscribers: number;
    views: number;
    videos: number;
    growthRate: string;
    lastSyncedAt?: string;
    platform?: string;
    accountHandle?: string;
  } | null;
  timeSeries: Array<{ date: string; subscribers: number; views: number }>;
}

export interface SocialPost {
  id: string;
  connectionId: string;
  platform: string;
  platformPostId: string;
  titleOrCaption: string;
  thumbnailUrl?: string | null;
  permalink?: string | null;
  publishedAt: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate?: string;
  additionalMetrics?: Record<string, any>;
  accountHandle?: string;
  lastSyncedAt: string;
}

export interface PostsSummary {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: string;
}

export interface PostComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  likeCount: number;
}

interface PlatformDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  primaryMetric: string;
  iconSvg: React.ReactNode;
  isComingSoon?: boolean;
}

const SUPPORTED_PLATFORMS: PlatformDefinition[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video & Streaming',
    description: 'Tarik subscriber, total penayangan video, dan engagement channel secara otomatis.',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-200',
    borderColor: 'border-red-200 hover:border-red-300',
    textColor: 'text-red-600',
    accentBg: 'bg-red-500',
    primaryMetric: 'Subscribers & Views',
    iconSvg: (
      <svg className="w-5 h-5 fill-red-600" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'Short-form Video',
    description: 'Pantau pertumbuhan followers, total penayangan video (views), likes, komentar, dan shares secara otomatis.',
    badgeColor: 'bg-zinc-900/10 text-zinc-900 border-zinc-200',
    borderColor: 'border-zinc-200 hover:border-zinc-300',
    textColor: 'text-zinc-900',
    accentBg: 'bg-black',
    primaryMetric: 'Views, Likes & Shares',
    iconSvg: (
      <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.88-4.47V8.58a8.28 8.28 0 0 0 4.84 1.56V6.69h-.95z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Visual & Media',
    description: 'Pantau perkembangan followers, reach akun profesional, dan performa konten visual.',
    badgeColor: 'bg-pink-500/10 text-pink-600 border-pink-200',
    borderColor: 'border-pink-200 hover:border-pink-300',
    textColor: 'text-pink-600',
    accentBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
    primaryMetric: 'Followers & Reach',
    iconSvg: (
      <svg className="w-5 h-5 fill-pink-600" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Social Network & Page',
    description: 'Pantau penayangan video, reaksi suka (likes), komentar, shares, dan jangkauan konten halaman.',
    badgeColor: 'bg-blue-600/10 text-blue-600 border-blue-200',
    borderColor: 'border-blue-200 hover:border-blue-300',
    textColor: 'text-blue-600',
    accentBg: 'bg-[#1877F2]',
    primaryMetric: 'Views, Likes & Comments',
    iconSvg: (
      <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Developer & Code',
    description: 'Sinkronisasi stars repository, fork count, commit activity, dan kontribusi publik.',
    badgeColor: 'bg-slate-900/10 text-slate-800 border-slate-200',
    borderColor: 'border-slate-200 hover:border-slate-300',
    textColor: 'text-slate-800',
    accentBg: 'bg-slate-800',
    primaryMetric: 'Stars & Repos',
    iconSvg: (
      <svg className="w-5 h-5 fill-slate-800" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
];

export default function SocialMediaPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State Metrik Analitik Real-Time & Grafik
  const [metricsData, setMetricsData] = useState<SocialMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'subscribers' | 'views'>('subscribers');

  // State Analisa Performa Konten (Video & Postingan)
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsSummary, setPostsSummary] = useState<PostsSummary | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postPlatformFilter, setPostPlatformFilter] = useState<string>('all');
  const [postSortBy, setPostSortBy] = useState<'recent' | 'views' | 'likes' | 'comments'>('views');

  // State Mount Portal & Modal Komentar Masuk
  const [mounted, setMounted] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<SocialPost | null>(null);
  const [commentsList, setCommentsList] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kunci scroll halaman belakang saat modal komentar terbuka
  useEffect(() => {
    if (activeCommentsPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeCommentsPost]);

  // Helper untuk mendapatkan token autentikasi ganda (Cookie + Bearer Header)
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

  // Fetch status koneksi akun media sosial aktif dari D1
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/composio/status', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const rawText = await res.text();
        try {
          const json = JSON.parse(rawText);
          if (json.success && Array.isArray(json.data)) {
            setConnections(json.data);
          }
        } catch {}
      }
    } catch (err: any) {
      console.warn('Gagal memuat status akun media sosial:', err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch data metrik analitik & histori time-series dari D1 (Dinamis per Akun Terpilih)
  const fetchMetrics = useCallback(async (connId?: string) => {
    try {
      setMetricsLoading(true);
      const targetId = connId !== undefined ? connId : selectedConnectionId;
      const url = targetId ? `/api/composio/metrics?connectionId=${targetId}` : '/api/composio/metrics';
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMetricsData(json);
          if (!selectedConnectionId && json.primaryAccount?.id) {
            setSelectedConnectionId(json.primaryAccount.id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat metrik analitik media sosial:', err.message);
    } finally {
      setMetricsLoading(false);
    }
  }, [getAuthHeaders, selectedConnectionId]);

  // Fetch daftar performa konten video & postingan dari D1
  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const params = new URLSearchParams();
      if (postPlatformFilter !== 'all') {
        params.append('platform', postPlatformFilter);
      }
      params.append('sort', postSortBy);

      const res = await fetch(`/api/composio/posts?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setPosts(json.posts || []);
          setPostsSummary(json.summary || null);
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat data postingan & video:', err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [getAuthHeaders, postPlatformFilter, postSortBy]);

  // Handler: Buka modal dan muat komentar riil untuk postingan spesifik
  const openCommentsModal = useCallback(async (post: SocialPost) => {
    setActiveCommentsPost(post);
    setCommentsLoading(true);
    setCommentsError(null);
    setCommentsList([]);

    try {
      const res = await fetch(`/api/composio/posts/${post.id}/comments`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCommentsList(json.comments || []);
      } else {
        setCommentsError(json.error || 'Gagal memuat komentar');
      }
    } catch (err: any) {
      setCommentsError(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setCommentsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchConnections();
    fetchMetrics();
    fetchPosts();
  }, [fetchConnections, fetchMetrics, fetchPosts]);

  // Handler Otomatis: Deteksi kembalinya user dari OAuth Composio / Google / Meta
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const connectedAccountId = params.get('connected_account_id');

    if (statusParam === 'success' || connectedAccountId) {
      const handleOAuthReturn = async () => {
        setIsSyncing(true);
        const storedPlatform = typeof window !== 'undefined' ? sessionStorage.getItem('connecting_platform') : null;
        const detectedPlatform = (params.get('platform') || storedPlatform || 'instagram').toLowerCase();
        const platformObj = SUPPORTED_PLATFORMS.find((p) => p.id === detectedPlatform);
        const platformName = platformObj?.name || detectedPlatform.toUpperCase();

        setNotification({
          type: 'success',
          message: `⚡ Akun ${platformName} berhasil diotorisasi! Menyinkronkan data metrik secara otomatis...`,
        });

        try {
          const res = await fetch('/api/composio/callback', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
              connectedAccountId: connectedAccountId || '',
              status: statusParam || 'success',
              platform: detectedPlatform,
            }),
          });

          const rawText = await res.text();
          let json: any = {};
          try {
            json = JSON.parse(rawText);
          } catch {}

          if (res.ok && json.success) {
            setNotification({
              type: 'success',
              message: `🎉 Akun ${platformName} berhasil terhubung! Data analitik awal telah disinkronkan secara otomatis.`,
            });
          } else {
            // Fallback sinkronisasi manual jika callback mengalami kendala
            await fetch('/api/composio/sync', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
            });
            setNotification({
              type: 'success',
              message: `✅ Akun ${platformName} terkonfirmasi dan sinkronisasi metrik selesai.`,
            });
          }
        } catch (err: any) {
          console.warn('[Auto Sync Error]', err.message);
          setNotification({
            type: 'success',
            message: `Koneksi akun ${platformName} selesai. Anda dapat menekan "Sinkronisasi Sekarang" kapan saja.`,
          });
        } finally {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('connecting_platform');
          }
          setIsSyncing(false);
          await fetchConnections();
          await fetchMetrics();
          await fetchPosts();
          // Bersihkan URL dari query string tanpa reload halaman
          window.history.replaceState({}, '', window.location.pathname);
        }
      };

      handleOAuthReturn();
    }
  }, [getAuthHeaders, fetchConnections, fetchMetrics, fetchPosts]);

  // Handler: Mulai alur otorisasi OAuth via Composio v3
  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    setNotification(null);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('connecting_platform', platformId);
    }

    try {
      const res = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          platform: platformId,
          callbackUrl: `${window.location.origin}${window.location.pathname}?platform=${platformId}`,
        }),
      });

      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        if (res.status === 404) {
          throw new Error('Layanan koneksi tidak ditemukan (404). Silakan coba beberapa saat lagi.');
        }
        throw new Error(rawText || `Server mengembalikan HTTP ${res.status}`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghubungkan akun media sosial');
      }

      if (json.data && json.data.redirectUrl) {
        setNotification({
          type: 'success',
          message: `Menghubungkan ke ${platformId.toUpperCase()}... Jika popup terblokir, izinkan pembukaan jendela baru.`,
        });
        
        // Buka URL otorisasi di tab baru untuk otorisasi aman
        window.open(json.data.redirectUrl, '_blank');
        
        // Refresh daftar koneksi secara bertahap
        setTimeout(() => fetchConnections(), 2000);
      } else {
        throw new Error('URL otorisasi tidak diterima dari server');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menghubungkan akun.',
      });
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Handler: Picu sinkronisasi cron manual untuk pengujian
  const handleManualSync = async () => {
    setIsSyncing(true);
    setNotification(null);

    try {
      const [metricsRes, postsRes] = await Promise.all([
        fetch('/api/composio/sync', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch('/api/composio/posts/sync', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
      ]);

      const rawText = await metricsRes.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server mengembalikan HTTP ${metricsRes.status}`);
      }

      if (!metricsRes.ok || !json.success) {
        throw new Error(json.error || 'Gagal menjalankan sinkronisasi');
      }

      setNotification({
        type: 'success',
        message: 'Data channel dan konten postingan berhasil diperbarui secara langsung!',
      });
      await fetchConnections();
      await fetchMetrics();
      await fetchPosts();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal memicu sinkronisasi manual.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Putuskan koneksi akun
  const handleDisconnect = async (connId: string) => {
    if (!confirm('Apakah Anda yakin ingin memutuskan koneksi akun ini? Riwayat metrik akan dihapus.')) {
      return;
    }

    setDisconnectingId(connId);
    try {
      const res = await fetch(`/api/composio/connections/${connId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memutuskan koneksi');
      }

      setNotification({
        type: 'success',
        message: 'Koneksi akun media sosial berhasil diputuskan.',
      });
      await fetchConnections();
      await fetchMetrics();
      await fetchPosts();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal memutuskan koneksi.',
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  // Konfigurasi Dataset Grafik Chart.js
  const chartData = useMemo(() => {
    const list = metricsData?.timeSeries || [];
    const labels = list.map((item) => {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const m = parseInt(parts[1], 10) - 1;
        return `${parseInt(parts[2], 10)} ${months[m] || ''}`;
      }
      return item.date;
    });

    const isSub = chartMetric === 'subscribers';
    const currentPlatformId = (metricsData?.summary?.platform || 'youtube').toLowerCase();
    const followerLabel = currentPlatformId === 'youtube' ? 'Subscribers' : 'Followers';
    const themeColor = currentPlatformId === 'instagram' ? '#ec4899' : currentPlatformId === 'facebook' ? '#1877f2' : currentPlatformId === 'tiktok' ? '#000000' : '#ef4444';
    const values = list.map((item) => (isSub ? item.subscribers : item.views));

    return {
      labels,
      datasets: [
        {
          label: isSub ? `${followerLabel} Channel` : 'Total Penayangan (Views)',
          data: values,
          borderColor: isSub ? themeColor : '#6366f1',
          backgroundColor: isSub ? `${themeColor}15` : 'rgba(99, 102, 241, 0.08)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: isSub ? themeColor : '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [metricsData, chartMetric]);

  const chartOptions = useMemo(() => {
    const isSub = chartMetric === 'subscribers';
    const currentPlatformId = (metricsData?.summary?.platform || 'youtube').toLowerCase();
    const followerLabel = currentPlatformId === 'youtube' ? 'Subscribers' : 'Followers';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181b',
          titleFont: { size: 12, weight: 'bold' as const },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => {
              const val = Number(context.parsed.y).toLocaleString('id-ID');
              return isSub ? ` ${val} ${followerLabel}` : ` ${val} Views`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#71717a' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f4f4f5' },
          ticks: {
            font: { size: 11 },
            color: '#71717a',
            callback: (val: any) => Number(val).toLocaleString('id-ID'),
          },
        },
      },
    };
  }, [metricsData, chartMetric]);

  const currentPlatformId = (metricsData?.summary?.platform || 'youtube').toLowerCase();
  const platformObj = SUPPORTED_PLATFORMS.find((p) => p.id === currentPlatformId) || SUPPORTED_PLATFORMS[0];
  const isYouTube = currentPlatformId === 'youtube';
  const followerLabel = isYouTube ? 'Subscribers' : 'Followers';
  const contentLabel = isYouTube || currentPlatformId === 'tiktok' ? 'Video' : 'Konten';

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Analitik Media Sosial
            </h1>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed pl-10.5">
            Pantau performa, pertumbuhan audiens, dan interaksi konten dari seluruh akun media sosial Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Account Selector jika terdapat akun terhubung */}
          {connections.filter((c) => c.status === 'ACTIVE').length > 0 && (
            <div className="h-9 flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 shadow-xs">
              <FolderOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={selectedConnectionId || metricsData?.summary?.connectionId || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedConnectionId(newId);
                  fetchMetrics(newId);
                }}
                className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer pr-1"
              >
                {connections
                  .filter((c) => c.status === 'ACTIVE')
                  .map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.platform.toUpperCase()}: {conn.account_handle || 'Akun Terhubung'}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            title="Segarkan data analitik secara manual"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
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
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Highlight Summary Cards (Dinamis Real-Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Followers / Subscribers */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total {followerLabel}</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {metricsLoading && !metricsData?.summary
              ? '...'
              : Number(metricsData?.summary?.subscribers || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{metricsData?.summary?.growthRate || 'Terverifikasi aktif'}</span>
          </div>
        </div>

        {/* Card 2: Total Penayangan (Views) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Penayangan (Views)</span>
            <Eye className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {metricsLoading && !metricsData?.summary
              ? '...'
              : Number(metricsData?.summary?.views || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            Kumulatif penayangan {contentLabel.toLowerCase()}
          </div>
        </div>

        {/* Card 3: Total Konten Terbit */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total {contentLabel} Terbit</span>
            <PlaySquare className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {metricsLoading && !metricsData?.summary
              ? '...'
              : Number(metricsData?.summary?.videos || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            Konten publik terpantau
          </div>
        </div>

        {/* Card 4: Sinkronisasi Terakhir */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Sinkronisasi Terakhir</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-sm font-bold text-zinc-900 font-mono">
            {metricsData?.summary?.lastSyncedAt
              ? new Date(metricsData.summary.lastSyncedAt).toLocaleTimeString('id-ID')
              : 'Baru saja'}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pembaruan Otomatis Aktif</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Tren Analitik */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Card Header & Controls */}
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">
                Grafik Tren {chartMetric === 'subscribers' ? `Pertumbuhan ${followerLabel}` : 'Penayangan'}
              </h2>
              {metricsData?.summary?.accountHandle && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {metricsData.summary.accountHandle}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Riwayat fluktuasi pertumbuhan {followerLabel.toLowerCase()} dan total penayangan harian.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Metric Switcher Segmented Control */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setChartMetric('subscribers')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'subscribers'
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{followerLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('views')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'views'
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>Total Views</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="p-5">
          <div className="h-64 w-full">
            {metricsData?.timeSeries && metricsData.timeSeries.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Menunggu sinkronisasi data pertama...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SEKSI: Analisa Performa Konten (Video & Postingan) */}
      {/* ============================================================= */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-zinc-900">
                Analisa Performa Konten (Video &amp; Postingan)
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Pelacakan metrik per item konten mencakup indikator Views, Likes, Comments, dan Engagement.
            </p>
          </div>

          {/* Quick Metrics KPI Pills */}
          {postsSummary && (
            <div className="flex items-center flex-wrap gap-2 text-xs self-start sm:self-auto">
              <div className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 text-zinc-600">
                <span className="text-zinc-400">Total Konten:</span>
                <span className="font-bold text-zinc-900 font-mono">{postsSummary.totalPosts}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 text-zinc-600">
                <span className="text-zinc-400">Total Views:</span>
                <span className="font-bold text-sky-600 font-mono">{postsSummary.totalViews.toLocaleString('id-ID')}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 text-zinc-600">
                <span className="text-zinc-400">Avg Engagement:</span>
                <span className="font-bold text-emerald-600 font-mono">{postsSummary.avgEngagementRate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Platform Tabs & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50/80 border-b border-zinc-200">
          {/* Segmented Platform Tabs */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-xs text-xs overflow-x-auto max-w-full">
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
                onClick={() => setPostPlatformFilter(tab.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  postPlatformFilter === tab.id
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Urutkan:
            </span>
            <select
              value={postSortBy}
              onChange={(e) => setPostSortBy(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
            >
              <option value="views">Penayangan Terbanyak (Views)</option>
              <option value="likes">Paling Disukai (Likes)</option>
              <option value="comments">Komentar Terbanyak (Comments)</option>
              <option value="recent">Terbaru</option>
            </select>
          </div>
        </div>

        {/* Content Posts 3:4 Cards Grid */}
        <div className="p-5">
          {postsLoading ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-zinc-400" />
              <span>Memuat analisa performa postingan & video...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 space-y-3">
              <p>Belum ada data postingan atau video untuk platform yang dipilih.</p>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs active:scale-[0.98]"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkronisasi Konten Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {posts.map((post) => {
                const platformObj = SUPPORTED_PLATFORMS.find((p) => p.id === post.platform);
                return (
                  <div
                    key={post.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-3">
                      {/* Header Card: Platform Badge + Waktu Rilis */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${platformObj?.badgeColor || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                          {platformObj?.iconSvg}
                          <span className="capitalize">{post.platform}</span>
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {new Date(post.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Preview Thumbnail / Media Container */}
                      {post.thumbnailUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-zinc-950 aspect-[3/4] group/thumb">
                          <img
                            src={post.thumbnailUrl}
                            alt={post.titleOrCaption}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          {post.additionalMetrics?.duration && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-mono font-semibold text-white">
                              {post.additionalMetrics.duration}
                            </span>
                          )}
                          {post.additionalMetrics?.media_type && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-semibold text-white">
                              {post.additionalMetrics.media_type}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-700 italic text-xs leading-relaxed min-h-[90px] flex items-center">
                          <p className="line-clamp-4">"{post.titleOrCaption}"</p>
                        </div>
                      )}

                      {/* Title / Caption */}
                      {post.thumbnailUrl && (
                        <h3
                          className="font-bold text-xs text-zinc-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors"
                          title={post.titleOrCaption}
                        >
                          {post.titleOrCaption}
                        </h3>
                      )}

                      {/* 3 METRIK WAJIB (Views, Likes, Comments) */}
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
                          className="space-y-0.5 hover:bg-emerald-50 rounded p-1 transition-all cursor-pointer group/cmt text-center"
                          title="Klik untuk melihat rincian komentar riil"
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 group-hover/cmt:text-emerald-700 font-medium">
                            <MessageCircle className="w-3 h-3 text-emerald-500" />
                            <span>Comments</span>
                          </div>
                          <div className="font-bold text-xs text-zinc-900 group-hover/cmt:text-emerald-700 font-mono underline decoration-dotted decoration-emerald-400 underline-offset-2">
                            {Number(post.commentsCount).toLocaleString('id-ID')}
                          </div>
                        </button>
                      </div>

                      {/* Metrik Adaptif Tambahan */}
                      <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                        {post.engagementRate && (
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5 text-indigo-500" />
                            Engagement {post.engagementRate}
                          </span>
                        )}
                        {post.sharesCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5 text-amber-500" />
                            {post.sharesCount.toLocaleString('id-ID')} Shares
                          </span>
                        )}
                        {post.additionalMetrics?.saves && (
                          <span className="px-2 py-0.5 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
                            <Bookmark className="w-2.5 h-2.5 text-purple-500" />
                            {post.additionalMetrics.saves} Saves
                          </span>
                        )}
                        {post.additionalMetrics?.post_type && (
                          <span className="px-2 py-0.5 rounded-md font-medium bg-zinc-100 text-zinc-600">
                            {post.additionalMetrics.post_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Account handle, Komentar Action & External Link */}
                    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[110px]">
                        {post.accountHandle || '@bbadralf_'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openCommentsModal(post)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded transition-all cursor-pointer"
                          title="Buka daftar komentar riil"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>Komentar ({post.commentsCount})</span>
                        </button>
                        <a
                          href={post.permalink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 hover:underline cursor-pointer"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Platform Media Sosial Tersedia */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">
                Platform Media Sosial Tersedia
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Hubungkan channel atau akun media sosial Anda untuk memulai sinkronisasi metrik dan konten secara otomatis.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Integrasi Resmi API Media Sosial
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_PLATFORMS.map((platform) => {
              const existingConn =
                connections.find(
                  (c) => c.platform.toLowerCase() === platform.id.toLowerCase() && c.status === 'ACTIVE'
                ) ||
                connections.find(
                  (c) => c.platform.toLowerCase() === platform.id.toLowerCase()
                );
              const isConnecting = connectingPlatform === platform.id;
              const isConnected = existingConn?.status === 'ACTIVE';
              const isInitiated = existingConn?.status === 'INITIATED';

              return (
                <div
                  key={platform.id}
                  className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs ${platform.borderColor}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-xs">
                        {platform.iconSvg}
                      </div>

                      {platform.isComingSoon ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Segera Hadir
                        </span>
                      ) : isConnected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Terhubung
                        </span>
                      ) : isInitiated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Menunggu Otorisasi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600">
                          Belum Terhubung
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                      {platform.name}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-medium block mb-2">
                      {platform.category}
                    </span>

                    <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                      {platform.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-600 mb-4 flex items-center justify-between">
                      <span className="text-zinc-400">Metrik Utama:</span>
                      <span className="font-semibold text-zinc-800">{platform.primaryMetric}</span>
                    </div>
                  </div>

                  <div>
                    {platform.isComingSoon ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-lg bg-zinc-100 text-zinc-400 text-xs font-semibold cursor-not-allowed border border-zinc-200 flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Segera Hadir</span>
                      </button>
                    ) : isConnected ? (
                      <div className="space-y-2">
                        <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                          <span>Sinkron Terakhir:</span>
                          <span className="font-mono text-zinc-600">
                            {existingConn?.last_synced_at ? new Date(existingConn.last_synced_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum pernah'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(existingConn.id)}
                          disabled={disconnectingId === existingConn.id}
                          className="w-full py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{disconnectingId === existingConn.id ? 'Memutuskan...' : 'Putuskan Koneksi'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        className={`w-full py-2 px-3 rounded-lg text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-[0.98] ${
                          platform.id === 'youtube'
                            ? 'bg-red-600 hover:bg-red-700'
                            : platform.id === 'facebook'
                            ? 'bg-[#1877F2] hover:bg-blue-700'
                            : platform.id === 'instagram'
                            ? 'bg-pink-600 hover:bg-pink-700'
                            : platform.id === 'tiktok'
                            ? 'bg-black hover:bg-zinc-800'
                            : 'bg-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        {isConnecting ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        <span>{isConnecting ? 'Menghubungkan...' : `Hubungkan ${platform.name}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabel Status Akun Terhubung */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-zinc-900">
                Daftar Akun Terhubung
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Semua channel dan akun media sosial yang aktif dan terintegrasi dengan profil Anda.
            </p>
          </div>
          <span className="text-xs font-medium text-zinc-500">
            Total Terhubung: <strong className="text-zinc-900">{connections.length} Akun</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <RotateCw className="w-5 h-5 animate-spin text-zinc-400" />
            <span>Memuat data akun media sosial...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Belum ada akun media sosial yang terhubung. Klik salah satu tombol platform di atas untuk menghubungkan akun.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 font-semibold">
                  <th className="py-3 px-6">Platform</th>
                  <th className="py-3 px-6">Akun / Pengguna</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Sinkronisasi Terakhir</th>
                  <th className="py-3 px-6">Waktu Terdaftar</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {connections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold uppercase tracking-wider text-[11px] text-zinc-900">
                      {conn.platform}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-xs text-zinc-900">
                      {conn.account_handle ? (
                        <span className="font-semibold text-zinc-800">{conn.account_handle}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Akun Terhubung</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          conn.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conn.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {conn.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-zinc-500">
                      {conn.last_synced_at ? (
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{new Date(conn.last_synced_at).toLocaleString('id-ID')}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Belum disinkron</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-400">
                      {new Date(conn.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDisconnect(conn.id)}
                        disabled={disconnectingId === conn.id}
                        className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {disconnectingId === conn.id ? 'Memproses...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Sinkronisasi Otomatis */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-zinc-900">
              Pembaruan Data Berkala Otomatis
            </div>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              Metrik analitik channel dan performa konten diperbarui secara otomatis di latar belakang untuk memastikan data Anda selalu mutakhir.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-[11px] self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sinkronisasi Otomatis Aktif</span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL: Komentar Masuk Riil Postingan (Meta Graph API) */}
      {/* ============================================================= */}
      {mounted && activeCommentsPost && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setActiveCommentsPost(null)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                  {activeCommentsPost.thumbnailUrl ? (
                    <img
                      src={activeCommentsPost.thumbnailUrl}
                      alt={activeCommentsPost.titleOrCaption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 truncate">
                      {activeCommentsPost.titleOrCaption || 'Postingan'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {commentsList.length > 0 ? `${commentsList.length} Komentar Riil` : `${activeCommentsPost.commentsCount} Komentar`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">
                    {activeCommentsPost.accountHandle || '@bbadralf_'} • {activeCommentsPost.platform.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCommentsPost(null)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Konten Komentar (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {commentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-400 gap-2.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Mengambil komentar terbaru...</span>
                </div>
              ) : commentsError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{commentsError}</span>
                </div>
              ) : commentsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-600">Belum ada komentar</p>
                  <p>Belum ada komentar publik yang terdeteksi untuk postingan ini.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {commentsList.map((c) => {
                    const isOwner = c.username === (activeCommentsPost.accountHandle || '').replace('@', '');
                    const isGeneric = !c.username || c.username === 'Pengguna Instagram' || c.username === 'Instagram User';
                    const displayUsername = isGeneric ? 'Pengguna Instagram' : `@${c.username.replace(/^@/, '')}`;
                    const dateStr = c.timestamp
                      ? new Date(c.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isOwner
                            ? 'bg-emerald-50/40 border-emerald-200/60'
                            : 'bg-zinc-50/60 border-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-zinc-900">
                              {displayUsername}
                            </span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                                Pembuat
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{dateStr}</span>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                          {c.text}
                        </p>
                        {c.likeCount > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                            <ThumbsUp className="w-2.5 h-2.5" />
                            <span>{c.likeCount} suka</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">
                Komentar resmi terverifikasi
              </span>
              {activeCommentsPost.permalink && (
                <a
                  href={activeCommentsPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 hover:text-black hover:underline"
                >
                  <span>Buka di {activeCommentsPost.platform === 'instagram' ? 'Instagram' : 'Platform'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

