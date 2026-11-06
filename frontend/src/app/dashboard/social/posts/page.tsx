'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { 
  ArrowUpDown, 
  RotateCw, 
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
  ChevronRight,
  TrendingUp,
  Clock,
  Layers
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

export default function SocialPostsPage() {
  const { currentProject } = useProject();

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

  // Filters & Search
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'recent'>('views');

  // Modal Komentar Masuk
  const [mounted, setMounted] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<SocialPost | null>(null);
  const [activeSentiment, setActiveSentiment] = useState<PostSentimentInfo | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [commentsList, setCommentsList] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

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

  // 2. Fetch Posts dengan Smart Filtering
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentProject?.id) {
        params.append('projectId', currentProject.id);
      }

      if (platformFilter && platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }

      // Smart Connection Filter: Hanya kirim connectionId jika bukan 'all'
      if (selectedConnectionId && selectedConnectionId !== 'all') {
        params.append('connectionId', selectedConnectionId);
      }

      params.append('sort', sortBy);

      const res = await fetch(`/api/composio/posts?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));

      if (json.success) {
        setPosts(json.posts || []);
        setPostsSummary(json.summary || null);
      }
    } catch (err: any) {
      console.warn('Gagal memuat data postingan:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, platformFilter, selectedConnectionId, sortBy, getAuthHeaders]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 3. Handle Manual Sync Konten
  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
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
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (json.success) {
        showNotification('success', json.message || 'Sinkronisasi postingan & video berhasil diperbarui!');
        await fetchPosts();
      } else {
        showNotification('error', json.error || 'Gagal menyinkronkan postingan');
      }
    } catch (e: any) {
      showNotification('error', 'Terjadi kesalahan jaringan saat sinkronisasi');
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

  // Filtered Posts berdasarkan Search Query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        (p.titleOrCaption || '').toLowerCase().includes(q) ||
        (p.accountHandle || '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

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

      {/* KPI Cards Ringkasan Konten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Konten */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Konten Terpantau</span>
            <PlaySquare className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {loading ? '...' : (postsSummary?.totalPosts || filteredPosts.length).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Video & postingan resmi</span>
          </div>
        </div>

        {/* Total Penayangan */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Penayangan (Views)</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
            {loading ? '...' : (postsSummary?.totalViews || 0).toLocaleString('id-ID')}
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
            {loading ? '...' : ((postsSummary?.totalLikes || 0) + (postsSummary?.totalComments || 0)).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            {(postsSummary?.totalLikes || 0).toLocaleString('id-ID')} likes, {(postsSummary?.totalComments || 0).toLocaleString('id-ID')} komentar
          </div>
        </div>

        {/* Rata-rata Engagement Rate */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Avg Engagement Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
            {loading ? '...' : (postsSummary?.avgEngagementRate || '0.0%')}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            Rasio likes & komentar per views
          </div>
        </div>
      </div>

      {/* Main Content Browser Card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
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

          {/* Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari caption, judul video, handle pengunggah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800 placeholder-zinc-400 shadow-2xs"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Urutkan:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
              >
                <option value="views">Penayangan Terbanyak (Views)</option>
                <option value="likes">Paling Disukai (Likes)</option>
                <option value="comments">Komentar Terbanyak (Comments)</option>
                <option value="recent">Tanggal Rilis Terbaru</option>
              </select>
            </div>
          </div>
        </div>

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
              {filteredPosts.map((post) => {
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

                      {/* Preview Thumbnail / Media Container */}
                      {post.thumbnailUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[3/4] group/thumb">
                          {post.thumbnailUrl.includes('.mp4') ? (
                            <video
                              src={post.thumbnailUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={post.thumbnailUrl}
                              alt={post.titleOrCaption}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
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
                      ) : (
                        <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-700 italic text-xs leading-relaxed min-h-[100px] flex items-center">
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
                        onClick={() => openCommentsModal(post)}
                        className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 font-medium cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
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
    </div>
  );
}
