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
  ArrowUpDown,
  Link2,
  Copy,
  Check,
  Plus,
  Compass,
  MousePointerClick,
  Globe,
  Lightbulb,
  Zap,
  Award,
  Smile,
  Calendar,
  Building2,
  Tag,
  Pencil,
  Lock,
  X
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

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
  project_id?: string | null;
  platform: string;
  composio_connection_id: string;
  account_handle?: string | null;
  account_label?: string | null;
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

export interface PostSentimentInfo {
  score: number;
  scorePct: number;
  label: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

export interface PostComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  likeCount: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  sentimentScorePct?: number;
  sentimentLabel?: string;
  matchedKeywords?: string[];
}

export interface AIInsightSummary {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: string;
  industryBenchmarkRate: string;
  relativePerformance: string;
}

export interface AISentiment {
  overallScore: number;
  sentimentLabel: string;
  totalCommentsAnalyzed: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  topPositiveKeywords: string[];
  topFeedbackKeywords: string[];
}

export interface AITimingInsight {
  bestDays: string[];
  bestTimeSlots: string[];
  peakSummary: string;
  bestDayDetail: { day: string; avgEngagementRate: number; postCount: number };
  matrix: Array<{ day: string; hourRange: string; score: number }>;
}

export interface AIPlatformPerformance {
  platform: string;
  postsCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: string;
}

export interface AIRecommendation {
  id: string;
  category: 'schedule' | 'sentiment' | 'format' | 'conversion';
  categoryLabel: string;
  title: string;
  description: string;
  actionItem: string;
  impact: string;
  priority: 'high' | 'medium';
}

export interface AIInsightsData {
  hasData: boolean;
  analyzedAt: string;
  summary: AIInsightSummary | null;
  sentiment: AISentiment | null;
  timing: AITimingInsight | null;
  platformBreakdown: AIPlatformPerformance[];
  recommendations: AIRecommendation[];
}

export interface SocialAttributionSummary {
  totalSocialClicks: number;
  totalWebClicks: number;
  socialContributionRate: string;
  topPlatform: string;
  topCtaName: string;
}

export interface PlatformAttributionBreakdown {
  platform: string;
  clicks: number;
  sessions: number;
  percentage: number;
}

export interface SocialAttributionCta {
  element_id: string;
  friendly_name: string;
  page_path: string;
  clicks: number;
  last_clicked: string;
}

export interface SocialConversionLog {
  id: number;
  element_id: string;
  friendly_name: string;
  page_path: string;
  country: string;
  city: string;
  created_at: string;
  platform: string;
  utm_campaign: string;
}

export interface SocialAttributionData {
  summary: SocialAttributionSummary;
  breakdown: PlatformAttributionBreakdown[];
  topCtas: SocialAttributionCta[];
  recentConversions: SocialConversionLog[];
}

export interface CampaignLink {
  id: string;
  platform: string;
  title: string;
  target_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  tracked_url: string;
  clicks_count: number;
  created_at: string;
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
  const { currentProject, userRole } = useProject();
  const isViewer = userRole === 'viewer';

  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State Ubah Label Akun & Modal Hubungkan Akun Baru
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const [savingLabel, setSavingLabel] = useState(false);
  const [connectModalPlatform, setConnectModalPlatform] = useState<PlatformDefinition | null>(null);
  const [connectAccountLabel, setConnectAccountLabel] = useState<string>('Akun Utama');

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
  const [activeCommentsPostSentiment, setActiveCommentsPostSentiment] = useState<PostSentimentInfo | null>(null);
  const [activeCommentSentimentFilter, setActiveCommentSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [commentsList, setCommentsList] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // State Intelijensi Konten & Analisis Sentimen AI
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);

  // State Atribusi Trafik & Konversi Media Sosial
  const [attributionData, setAttributionData] = useState<SocialAttributionData | null>(null);
  const [attributionLoading, setAttributionLoading] = useState(false);
  const [campaignLinks, setCampaignLinks] = useState<CampaignLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Modal Generator Link-in-Bio
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    platform: 'instagram',
    title: '',
    targetUrl: '',
    campaignName: '',
  });
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

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

  // Fetch status koneksi akun media sosial aktif dari D1 (terisolasi per Workspace)
  const fetchConnections = useCallback(async () => {
    try {
      const q = currentProject?.id ? `?projectId=${encodeURIComponent(currentProject.id)}` : '';
      const res = await fetch(`/api/composio/status${q}`, {
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
  }, [getAuthHeaders, currentProject?.id]);

  // Fetch data metrik analitik & histori time-series dari D1 (Dinamis per Akun Terpilih & Workspace)
  const fetchMetrics = useCallback(async (connId?: string) => {
    try {
      setMetricsLoading(true);
      const targetId = connId !== undefined ? connId : selectedConnectionId;
      const params = new URLSearchParams();
      if (targetId) params.append('connectionId', targetId);
      if (currentProject?.id) params.append('projectId', currentProject.id);

      const url = `/api/composio/metrics?${params.toString()}`;
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
  }, [getAuthHeaders, selectedConnectionId, currentProject?.id]);

  // Fetch daftar performa konten video & postingan dari D1
  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const params = new URLSearchParams();
      if (postPlatformFilter !== 'all') {
        params.append('platform', postPlatformFilter);
      }
      params.append('sort', postSortBy);
      if (currentProject?.id) {
        params.append('projectId', currentProject.id);
      }

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
  }, [getAuthHeaders, postPlatformFilter, postSortBy, currentProject?.id]);

  // Handler: Buka modal dan muat komentar riil untuk postingan spesifik
  const openCommentsModal = useCallback(async (post: SocialPost) => {
    setActiveCommentsPost(post);
    setActiveCommentsPostSentiment(null);
    setActiveCommentSentimentFilter('all');
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
        setActiveCommentsPostSentiment(json.postSentiment || null);
      } else {
        setCommentsError(json.error || 'Gagal memuat komentar');
      }
    } catch (err: any) {
      setCommentsError(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setCommentsLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch data intelijensi konten dan analisis sentimen AI
  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const params = new URLSearchParams();
      if (postPlatformFilter !== 'all') {
        params.append('platform', postPlatformFilter);
      }
      if (selectedConnectionId) {
        params.append('connectionId', selectedConnectionId);
      }
      if (currentProject?.id) {
        params.append('projectId', currentProject.id);
      }

      const res = await fetch(`/api/composio/insights?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInsightsData(json);
      }
    } catch (err: any) {
      console.warn('[Fetch Insights Error]', err.message);
    } finally {
      setInsightsLoading(false);
    }
  }, [getAuthHeaders, postPlatformFilter, selectedConnectionId, currentProject?.id]);

  // Handler: Refresh manual analisis intelijensi AI
  const handleRefreshInsights = async () => {
    setInsightsRefreshing(true);
    try {
      await fetch('/api/composio/insights/refresh', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      await fetchInsights();
      setNotification({
        type: 'success',
        message: 'Analisis intelijensi AI berhasil diperbarui.',
      });
    } catch (err: any) {
      console.warn('[Refresh Insights Error]', err.message);
    } finally {
      setInsightsRefreshing(false);
    }
  };

  // Fetch data atribusi trafik dan konversi media sosial
  const fetchAttribution = useCallback(async () => {
    setAttributionLoading(true);
    try {
      const q = currentProject?.id ? `?projectId=${encodeURIComponent(currentProject.id)}` : '';
      const res = await fetch(`/api/composio/attribution${q}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAttributionData(json.data);
      }
    } catch (err: any) {
      console.warn('[Fetch Attribution Error]', err.message);
    } finally {
      setAttributionLoading(false);
    }
  }, [getAuthHeaders, currentProject?.id]);

  // Fetch daftar tautan pelacak kampanye Link-in-Bio
  const fetchCampaignLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const q = currentProject?.id ? `?projectId=${encodeURIComponent(currentProject.id)}` : '';
      const res = await fetch(`/api/composio/links${q}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCampaignLinks(json.data || []);
      }
    } catch (err: any) {
      console.warn('[Fetch Links Error]', err.message);
    } finally {
      setLinksLoading(false);
    }
  }, [getAuthHeaders, currentProject?.id]);

  // Handler: Buat tautan pelacak baru
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.title || !linkForm.targetUrl) {
      alert('Judul tautan dan URL tujuan wajib diisi.');
      return;
    }

    setIsCreatingLink(true);
    try {
      const res = await fetch('/api/composio/links', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...linkForm,
          projectId: currentProject?.id || 'prj_default',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsLinkModalOpen(false);
        setLinkForm({ platform: 'instagram', title: '', targetUrl: '', campaignName: '' });
        setNotification({
          type: 'success',
          message: 'Tautan pelacak Link-in-Bio berhasil dibuat dan siap disalin!',
        });
        await fetchCampaignLinks();
        await fetchAttribution();
      } else {
        alert(json.error || 'Gagal membuat tautan pelacak');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat membuat tautan');
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Handler: Update label akun (multi-account renaming)
  const handleUpdateLabel = async (connId: string) => {
    if (!editingLabelValue.trim()) return;
    setSavingLabel(true);
    try {
      const res = await fetch(`/api/composio/connections/${connId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ accountLabel: editingLabelValue.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConnections((prev) =>
          prev.map((c) => (c.id === connId ? { ...c, account_label: editingLabelValue.trim() } : c))
        );
        setEditingConnId(null);
        setNotification({
          type: 'success',
          message: 'Label akun berhasil diperbarui.',
        });
      } else {
        alert(json.error || 'Gagal mengubah label akun');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah label akun');
    } finally {
      setSavingLabel(false);
    }
  };

  // Handler: Hapus tautan pelacak
  const handleDeleteLink = async (id: string) => {
    if (!confirm('Hapus tautan pelacak kampanye ini?')) return;
    setDeletingLinkId(id);
    try {
      const res = await fetch(`/api/composio/links/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchCampaignLinks();
        await fetchAttribution();
      } else {
        alert(json.error || 'Gagal menghapus tautan');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tautan');
    } finally {
      setDeletingLinkId(null);
    }
  };

  // Handler: Salin tautan ke clipboard
  const handleCopyLink = (url: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2500);
    }
  };

  // Reset selected connection ketika berganti workspace
  useEffect(() => {
    setSelectedConnectionId(null);
  }, [currentProject?.id]);

  useEffect(() => {
    fetchConnections();
    fetchMetrics();
    fetchPosts();
    fetchInsights();
    fetchAttribution();
    fetchCampaignLinks();
  }, [fetchConnections, fetchMetrics, fetchPosts, fetchInsights, fetchAttribution, fetchCampaignLinks]);

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
        const storedLabel = typeof window !== 'undefined' ? sessionStorage.getItem('connecting_account_label') : null;
        const storedProjectId = typeof window !== 'undefined' ? sessionStorage.getItem('connecting_project_id') : null;
        const detectedPlatform = (params.get('platform') || storedPlatform || 'instagram').toLowerCase();
        const detectedProjectId = params.get('project_id') || storedProjectId || currentProject?.id || 'prj_default';
        const detectedLabel = storedLabel || 'Akun Utama';

        const platformObj = SUPPORTED_PLATFORMS.find((p) => p.id === detectedPlatform);
        const platformName = platformObj?.name || detectedPlatform.toUpperCase();

        setNotification({
          type: 'success',
          message: `⚡ Akun ${platformName} ("${detectedLabel}") berhasil diotorisasi! Menyinkronkan data metrik secara otomatis...`,
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
              projectId: detectedProjectId,
              accountLabel: detectedLabel,
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
              message: `🎉 Akun ${platformName} ("${detectedLabel}") berhasil terhubung! Data analitik awal telah disinkronkan secara otomatis.`,
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
            sessionStorage.removeItem('connecting_account_label');
            sessionStorage.removeItem('connecting_project_id');
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
  }, [getAuthHeaders, fetchConnections, fetchMetrics, fetchPosts, currentProject?.id]);

  // Handler: Mulai alur otorisasi OAuth via Composio v3 dengan label dan projectId
  const handleConnect = async (platformId: string, customLabel?: string) => {
    setConnectingPlatform(platformId);
    setNotification(null);

    const labelToUse = customLabel || connectAccountLabel || 'Akun Utama';
    const targetProjectId = currentProject?.id || 'prj_default';

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('connecting_platform', platformId);
      sessionStorage.setItem('connecting_account_label', labelToUse);
      sessionStorage.setItem('connecting_project_id', targetProjectId);
    }

    try {
      const res = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          platform: platformId,
          projectId: targetProjectId,
          accountLabel: labelToUse,
          callbackUrl: `${window.location.origin}${window.location.pathname}?platform=${platformId}&project_id=${targetProjectId}`,
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
          message: `Menghubungkan ke ${platformId.toUpperCase()} ("${labelToUse}")... Jika popup terblokir, izinkan pembukaan jendela baru.`,
        });
        
        // Buka URL otorisasi di tab baru untuk otorisasi aman
        window.open(json.data.redirectUrl, '_blank');
        setConnectModalPlatform(null);
        
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
      await fetchInsights();
      await fetchAttribution();
      await fetchCampaignLinks();
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
      await fetchInsights();
      await fetchAttribution();
      await fetchCampaignLinks();
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Analitik Media Sosial
            </h1>
            {currentProject && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <Building2 className="w-3 h-3 text-zinc-500" />
                <span>{currentProject.name}</span>
              </span>
            )}
            {isViewer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Anda hanya memiliki izin melihat. Tidak dapat menambah/mengedit akun.">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
                Mode Viewer
              </span>
            )}
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
                      {conn.platform.toUpperCase()}
                      {conn.account_label ? ` [${conn.account_label}]` : ''}: {conn.account_handle || 'Akun Terhubung'}
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

      {/* Empty State Banner: Workspace Belum Memiliki Akun Terhubung */}
      {!loading && connections.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-zinc-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <span>Workspace &ldquo;{currentProject?.name || 'Aktif'}&rdquo; belum memiliki akun media sosial</span>
              </h3>
              <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xl">
                Setiap workspace memiliki data analitik yang terisolasi. Jika akun media sosial Anda berada di workspace lain, silakan beralih melalui menu di navbar atas, atau hubungkan akun baru untuk workspace ini di bawah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('platforms-integration-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hubungkan Akun Baru</span>
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
                        {post.accountHandle || connections.find((c) => c.platform.toLowerCase() === post.platform.toLowerCase())?.account_handle || '-'}
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

      {/* ============================================================= */}
      {/* SEKSI: Intelijensi Konten & Analisis Sentimen AI */}
      {/* ============================================================= */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-bold text-zinc-900">
                Intelijensi Konten &amp; Analisis Sentimen AI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                Real-Time NLP &amp; Pattern AI
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Analisis performa postingan otomatis, sentimen komentar riil dari audiens, dan rekomendasi taktis berbasis data.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefreshInsights}
              disabled={insightsRefreshing || insightsLoading}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${insightsRefreshing ? 'animate-spin' : ''}`} />
              <span>{insightsRefreshing ? 'Menganalisis...' : 'Perbarui Analisis AI'}</span>
            </button>
          </div>
        </div>

        {/* 3 Top Intelligence KPI Cards */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KPI 1: Skor Sentimen Komunitas */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Skor Sentimen Audiens</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Smile className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-zinc-900">
                  {insightsData?.sentiment ? `${insightsData.sentiment.overallScore}%` : '-'}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {insightsData?.sentiment?.sentimentLabel || 'Netral'}
                </span>
              </div>
              {/* Multi-segment Sentiment Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-zinc-100 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${insightsData?.sentiment?.positivePct || 0}%` }}
                    title={`Positif: ${insightsData?.sentiment?.positivePct || 0}%`}
                  />
                  <div
                    className="bg-zinc-300 h-full transition-all duration-500"
                    style={{ width: `${insightsData?.sentiment?.neutralPct || 100}%` }}
                    title={`Netral: ${insightsData?.sentiment?.neutralPct || 100}%`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${insightsData?.sentiment?.negativePct || 0}%` }}
                    title={`Perlu Perhatian: ${insightsData?.sentiment?.negativePct || 0}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="text-emerald-600 font-medium">{insightsData?.sentiment?.positivePct || 0}% Positif</span>
                  <span className="text-zinc-500 font-medium">{insightsData?.sentiment?.neutralPct || 0}% Netral</span>
                  <span className="text-rose-600 font-medium">{insightsData?.sentiment?.negativePct || 0}% Evaluasi</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Waktu Unggah Terbaik (Prime Time) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Jadwal Unggahan Emas</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-zinc-900 truncate">
                {insightsData?.timing?.bestDays?.slice(0, 2).join(' & ') || 'Jumat & Sabtu'}
              </div>
              <p className="text-[11px] text-zinc-600 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Puncak interaksi: {insightsData?.timing?.bestTimeSlots?.[0] || '18:00 - 21:00 WIB'}</span>
              </p>
              <p className="text-[10px] text-zinc-400">
                Berdasarkan riwayat engagement tertinggi
              </p>
            </div>

            {/* KPI 3: Tolok Ukur Kinerja (Engagement Benchmark) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Rasio Keterlibatan Rata-rata</span>
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-zinc-900">
                  {insightsData?.summary?.avgEngagementRate || '0.0%'}
                </span>
                <span className="text-[11px] font-semibold text-violet-600">
                  {insightsData?.summary?.relativePerformance || 'Standar Industri'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Benchmark industri umum: {insightsData?.summary?.industryBenchmarkRate || '3.5% - 5.0%'}
              </p>
              <p className="text-[10px] text-zinc-400">
                Dari {insightsData?.summary?.totalPosts || 0} postingan aktif terpantau
              </p>
            </div>
          </div>
        </div>

        {/* Section Konten Tengah: Kata Kunci Sentimen & Pola Hari */}
        <div className="p-5 border-b border-zinc-200 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white">
          {/* Sisi Kiri: Kata Kunci Komentar (Sentimen & Feedback) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Suara Audiens &amp; Kata Kunci Dominan</span>
            </h3>

            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mb-2">
                  <ThumbsUp className="w-3 h-3 text-emerald-600" />
                  Topik Paling Diapresiasi Komunitas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {insightsData?.sentiment?.topPositiveKeywords && insightsData.sentiment.topPositiveKeywords.length > 0 ? (
                    insightsData.sentiment.topPositiveKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100/70 text-emerald-800 border border-emerald-200/60"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">
                      {insightsData?.summary?.totalComments === 0 ? 'Belum ada komentar publik untuk dianalisis.' : 'Apresiasi audiens bernuansa positif merata.'}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/60">
                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mb-2">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Aspek yang Perlu Evaluasi / Perhatian:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {insightsData?.sentiment?.topFeedbackKeywords && insightsData.sentiment.topFeedbackKeywords.length > 0 ? (
                    insightsData.sentiment.topFeedbackKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100/70 text-amber-800 border border-amber-200/60"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">
                      Tidak terdeteksi keluhan atau masukan negatif dominan.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Breakdown Efisiensi Platform */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Efisiensi Interaksi per Saluran Sosial</span>
            </h3>

            <div className="space-y-2">
              {insightsData?.platformBreakdown && insightsData.platformBreakdown.length > 0 ? (
                insightsData.platformBreakdown.map((pb) => {
                  return (
                    <div
                      key={pb.platform}
                      className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                        <div>
                          <span className="font-bold text-xs capitalize text-zinc-900 block truncate">
                            {pb.platform}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {pb.postsCount} konten • {pb.totalViews.toLocaleString('id-ID')} views
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-zinc-900 block">
                          {pb.engagementRate}
                        </span>
                        <span className="text-[10px] text-zinc-400">Engagement</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-400">
                  Data efisiensi platform akan muncul setelah konten disinkronkan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Bawah: 4 Rekomendasi Taktis Berbasis AI (Actionable Cards) */}
        <div className="p-5 bg-zinc-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Rekomendasi Taktis &amp; Langkah Selanjutnya</span>
            </h3>
            <span className="text-[11px] text-zinc-400">Dihasilkan oleh model analitik Firenalytics AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insightsData?.recommendations && insightsData.recommendations.length > 0 ? (
              insightsData.recommendations.map((rec) => {
                const isHigh = rec.priority === 'high';
                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {rec.categoryLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {isHigh ? 'Prioritas Tinggi' : 'Rekomendasi'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 text-zinc-700 font-medium min-w-0">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate text-[11px]">{rec.actionItem}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                        {rec.impact}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 py-6 text-center text-xs text-zinc-400">
                Memuat rekomendasi cerdas dari data akun Anda...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SEKSI: Atribusi Trafik & Konversi Media Sosial (Cross-Platform Attribution) */}
      {/* ============================================================= */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-zinc-900">
                Atribusi Trafik &amp; Konversi Media Sosial
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Pelacakan konversi klik tombol website yang terkonversi langsung dari tautan Bio media sosial dan kampanye UTM.
            </p>
          </div>

          {!isViewer ? (
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Tautan Pelacak (Link-in-Bio)</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-500 text-xs flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Pembuatan Link Dibatasi (Viewer)</span>
            </div>
          )}
        </div>

        {/* 4 Kartu KPI Atribusi Teratas */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Klik Web dari Sosial */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Klik Web dari Sosial</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <MousePointerClick className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900">
                {attributionData?.summary.totalSocialClicks || 0}
              </div>
              <p className="text-[11px] text-zinc-400">
                Total aksi klik pengunjung dari kanal sosial
              </p>
            </div>

            {/* KPI 2: Saluran Konversi Teratas */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Saluran Teratas</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold capitalize text-zinc-900 truncate">
                {attributionData?.summary.topPlatform && attributionData.summary.topPlatform !== '-' ? attributionData.summary.topPlatform : '-'}
              </div>
              <p className="text-[11px] text-zinc-400">
                Platform dengan volume klik tertinggi
              </p>
            </div>

            {/* KPI 3: Tombol Paling Diminati */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>CTA Favorit Audiens</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-zinc-900 truncate" title={attributionData?.summary.topCtaName}>
                {attributionData?.summary.topCtaName && attributionData.summary.topCtaName !== '-' ? attributionData.summary.topCtaName : '-'}
              </div>
              <p className="text-[11px] text-zinc-400">
                Tombol yang paling sering dikonversi
              </p>
            </div>

            {/* KPI 4: Rasio Kontribusi Trafik Sosial */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Kontribusi Trafik</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {attributionData?.summary.socialContributionRate || '0.0%'}
              </div>
              <p className="text-[11px] text-zinc-400">
                Pangsa klik website dari media sosial
              </p>
            </div>
          </div>
        </div>

        {/* 2 Kolom: Distribusi Platform & Tautan Pelacak Aktif */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 border-b border-zinc-200">
          {/* Kolom Kiri: Distribusi Konversi per Platform */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Distribusi Konversi per Platform</span>
              </h3>
              <span className="text-[11px] text-zinc-400 font-mono">Real-time Referral</span>
            </div>

            {attributionData && attributionData.breakdown.length > 0 ? (
              <div className="space-y-3">
                {attributionData.breakdown.map((item) => {
                  const pObj = SUPPORTED_PLATFORMS.find((p) => p.id === item.platform);
                  return (
                    <div key={item.platform} className="space-y-1.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.platform === 'instagram' ? 'bg-pink-500' :
                            item.platform === 'tiktok' ? 'bg-black' :
                            item.platform === 'youtube' ? 'bg-red-500' :
                            item.platform === 'facebook' ? 'bg-blue-600' : 'bg-slate-700'
                          }`} />
                          <span className="font-semibold text-zinc-800 capitalize">{pObj?.name || item.platform}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-zinc-500">{item.sessions} sesi unik</span>
                          <span className="font-bold text-zinc-900">{item.clicks} klik ({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.platform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-rose-500' :
                            item.platform === 'tiktok' ? 'bg-zinc-900' :
                            item.platform === 'youtube' ? 'bg-red-600' :
                            item.platform === 'facebook' ? 'bg-blue-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.max(5, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                Belum ada klik yang terdeteksi dari media sosial. Pasang tautan pelacak di Bio akun Anda!
              </div>
            )}
          </div>

          {/* Kolom Kanan: Tautan Pelacak Link-in-Bio Aktif */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-zinc-600" />
                <span>Tautan Link-in-Bio Aktif</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">
                {campaignLinks.length} Tautan Tersedia
              </span>
            </div>

            {campaignLinks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
                <p>Belum ada tautan pelacak kampanye pada workspace ini.</p>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    + Buat Tautan Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {campaignLinks.map((link) => {
                  const pObj = SUPPORTED_PLATFORMS.find((p) => p.id === link.platform);
                  const isCopied = copiedLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      className="p-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-2xs space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${pObj?.badgeColor || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                            {pObj?.iconSvg}
                            <span className="capitalize">{link.platform}</span>
                          </span>
                          <span className="font-bold text-xs text-zinc-900 truncate">
                            {link.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono font-bold flex items-center gap-1">
                            <MousePointerClick className="w-2.5 h-2.5 text-sky-600" />
                            {link.clicks_count} klik
                          </span>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={deletingLinkId === link.id}
                              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus tautan ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tracked URL with copy button */}
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-700">
                        <span className="truncate flex-1 select-all" title={link.tracked_url}>
                          {link.tracked_url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.tracked_url, link.id)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                            isCopied ? 'bg-emerald-600 text-white' : 'bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                          <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tabel Log Konversi Tombol Website Terkini */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Log Konversi Tombol Website Terkini dari Media Sosial</span>
            </h3>
            <span className="text-[11px] text-zinc-400">10 Interaksi Terakhir</span>
          </div>

          {attributionData && attributionData.recentConversions.length > 0 ? (
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-4">Waktu</th>
                    <th className="py-2.5 px-4">Platform Asal</th>
                    <th className="py-2.5 px-4">Halaman Dikunjungi</th>
                    <th className="py-2.5 px-4">Tombol CTA Diklik</th>
                    <th className="py-2.5 px-4">Kampanye / Tag</th>
                    <th className="py-2.5 px-4">Lokasi Pengunjung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {attributionData.recentConversions.map((conv) => {
                    const pObj = SUPPORTED_PLATFORMS.find((p) => p.id === conv.platform);
                    return (
                      <tr key={conv.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                          {new Date(conv.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${pObj?.badgeColor || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                            {pObj?.iconSvg}
                            <span className="capitalize">{conv.platform}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-zinc-800 text-[11px]">
                          {conv.page_path}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                            {conv.friendly_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500">
                          {conv.utm_campaign || 'link_bio_direct'}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-500 text-[11px]">
                          {conv.city ? `${conv.city}, ${conv.country}` : conv.country || 'Indonesia'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-zinc-400">
              Belum ada log klik konversi dari media sosial.
            </div>
          )}
        </div>
      </div>

      {/* Platform Media Sosial Tersedia */}
      <div id="platforms-integration-section" className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden scroll-mt-24">
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
              const platformConns = connections.filter(
                (c) => c.platform.toLowerCase() === platform.id.toLowerCase() && c.status === 'ACTIVE'
              );
              const hasActiveConn = platformConns.length > 0;
              const hasInitiatedConn = connections.some(
                (c) => c.platform.toLowerCase() === platform.id.toLowerCase() && c.status === 'INITIATED'
              );
              const isConnecting = connectingPlatform === platform.id;

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
                      ) : hasActiveConn ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {platformConns.length} Terhubung
                        </span>
                      ) : hasInitiatedConn ? (
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
                    ) : isViewer ? (
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Akses Viewer (Hanya Baca)</span>
                      </div>
                    ) : hasActiveConn ? (
                      <div className="space-y-2">
                        {/* List Akun Terhubung Singkat */}
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {platformConns.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-200/80"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-semibold text-zinc-900 truncate text-[11px] flex items-center gap-1.5">
                                  <span>{c.account_handle || 'Akun'}</span>
                                  <span className="text-[10px] font-medium text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                                    {c.account_label || 'Utama'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDisconnect(c.id)}
                                disabled={disconnectingId === c.id}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer disabled:opacity-50 shrink-0"
                                title="Putuskan akun ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Tombol Hubungkan Akun Tambahan (Multi-Account) */}
                        <button
                          type="button"
                          onClick={() => {
                            setConnectAccountLabel(`Akun ${platform.name} #${platformConns.length + 1}`);
                            setConnectModalPlatform(platform);
                          }}
                          disabled={isConnecting}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Akun {platform.name} Lain</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConnectAccountLabel('Akun Utama');
                          setConnectModalPlatform(platform);
                        }}
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
              Semua channel dan akun media sosial yang aktif dan terisolasi pada workspace <strong>{currentProject?.name}</strong>.
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
            Belum ada akun media sosial yang terhubung pada workspace ini. Klik salah satu tombol platform di atas untuk menghubungkan akun.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 font-semibold">
                  <th className="py-3 px-6">Platform</th>
                  <th className="py-3 px-6">Label / Brand</th>
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
                    <td className="py-3.5 px-6">
                      {editingConnId === conn.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingLabelValue}
                            onChange={(e) => setEditingLabelValue(e.target.value)}
                            className="w-32 px-2 py-1 text-xs border border-zinc-300 rounded focus:border-zinc-900 focus:outline-none bg-white"
                            placeholder="Label akun"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateLabel(conn.id)}
                            disabled={savingLabel}
                            className="p-1 rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                            title="Simpan label"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingConnId(null)}
                            disabled={savingLabel}
                            className="p-1 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                            title="Batal"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 border border-zinc-200 text-zinc-800">
                            <Tag className="w-2.5 h-2.5 text-zinc-400" />
                            {conn.account_label || 'Akun Utama'}
                          </span>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingConnId(conn.id);
                                setEditingLabelValue(conn.account_label || 'Akun Utama');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 transition-opacity cursor-pointer"
                              title="Ubah label akun"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
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
                      {isViewer ? (
                        <span className="text-zinc-400 text-[11px] italic">Hanya Baca</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(conn.id)}
                          disabled={disconnectingId === conn.id}
                          className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {disconnectingId === conn.id ? 'Memproses...' : 'Hapus'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL: Komentar Masuk Riil Multi-Platform (Instagram, YouTube, TikTok) */}
      {/* ============================================================= */}
      {mounted && activeCommentsPost && (() => {
        const postPlatform = (activeCommentsPost.platform || '').toLowerCase();
        const platformLabel =
          postPlatform === 'youtube'
            ? 'YouTube'
            : postPlatform === 'tiktok'
            ? 'TikTok'
            : postPlatform === 'instagram'
            ? 'Instagram'
            : postPlatform
            ? postPlatform.toUpperCase()
            : 'Platform';

        return createPortal(
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
                        {commentsList.length > 0 ? `${commentsList.length} Komentar Riil (${platformLabel})` : `${activeCommentsPost.commentsCount} Komentar`}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono truncate">
                      {(activeCommentsPost.accountHandle || connections.find((c) => c.platform.toLowerCase() === activeCommentsPost.platform.toLowerCase())?.account_handle || '-')} • {platformLabel}
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
                <div className="space-y-3">
                  {/* Sentimen Postingan Berbasis AI */}
                  {activeCommentsPostSentiment && (
                    <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          <span>Sentimen Audiens: </span>
                          <span className="text-violet-700 font-semibold">{activeCommentsPostSentiment.label}</span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 font-bold">
                          {activeCommentsPostSentiment.scorePct}% Skor Positif
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {activeCommentsPostSentiment.positiveCount} Positif ({activeCommentsPostSentiment.positivePct}%)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 font-medium">
                          {activeCommentsPostSentiment.neutralCount} Netral ({activeCommentsPostSentiment.neutralPct}%)
                        </span>
                        {activeCommentsPostSentiment.negativeCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                            {activeCommentsPostSentiment.negativeCount} Evaluasi ({activeCommentsPostSentiment.negativePct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Filter Tab Sentimen */}
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveCommentSentimentFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        activeCommentSentimentFilter === 'all'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Semua ({commentsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentSentimentFilter('positive')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        activeCommentSentimentFilter === 'positive'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Positif ({commentsList.filter((c) => c.sentiment === 'positive').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentSentimentFilter('neutral')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        activeCommentSentimentFilter === 'neutral'
                          ? 'bg-zinc-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      Netral ({commentsList.filter((c) => c.sentiment === 'neutral').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentSentimentFilter('negative')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        activeCommentSentimentFilter === 'negative'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Evaluasi ({commentsList.filter((c) => c.sentiment === 'negative').length})
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {commentsList
                      .filter((c) => {
                        if (activeCommentSentimentFilter === 'all') return true;
                        return c.sentiment === activeCommentSentimentFilter;
                      })
                      .map((c) => {
                        const isOwner = c.username === (activeCommentsPost.accountHandle || '').replace('@', '');
                        const isGeneric = !c.username || c.username.toLowerCase().includes('pengguna') || c.username.toLowerCase().includes('user');
                        const displayUsername = isGeneric ? `Pengguna ${platformLabel}` : `@${c.username.replace(/^@/, '')}`;
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-zinc-900">
                                  {displayUsername}
                                </span>
                                {isOwner && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                                    Pembuat
                                  </span>
                                )}
                                {c.sentiment && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      c.sentiment === 'positive'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                                        : c.sentiment === 'negative'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200/60'
                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200/60'
                                    }`}
                                  >
                                    {c.sentimentLabel || (c.sentiment === 'positive' ? 'Positif' : c.sentiment === 'negative' ? 'Evaluasi' : 'Netral')}
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

                    {commentsList.filter((c) => {
                      if (activeCommentSentimentFilter === 'all') return true;
                      return c.sentiment === activeCommentSentimentFilter;
                    }).length === 0 && (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        Tidak ada komentar dengan kategori sentimen ini.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">
                Komentar resmi terverifikasi ({platformLabel})
              </span>
              {activeCommentsPost.permalink && (
                <a
                  href={activeCommentsPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 hover:text-black hover:underline"
                >
                  <span>Buka di {platformLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      );
    })()}

      {/* ============================================================= */}
      {/* MODAL: Generator Tautan Pelacak Link-in-Bio */}
      {/* ============================================================= */}
      {mounted && isLinkModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsLinkModalOpen(false)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">
                    Buat Tautan Pelacak (Link-in-Bio)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Workspace: <strong className="text-zinc-700">{currentProject?.name}</strong> • Otomatis menambahkan tag UTM untuk melacak klik website dari media sosial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              {/* Pilihan Platform */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-800">
                  Target Platform Media Sosial
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'instagram', label: 'Instagram Bio' },
                    { id: 'tiktok', label: 'TikTok Bio' },
                    { id: 'youtube', label: 'YouTube Deskripsi' },
                    { id: 'facebook', label: 'Facebook Page' },
                    { id: 'twitter', label: 'X / Twitter Bio' },
                    { id: 'custom', label: 'Lainnya / Kustom' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLinkForm({ ...linkForm, platform: p.id })}
                      className={`py-2 px-2.5 rounded-lg font-medium border text-[11px] transition-all cursor-pointer text-center ${
                        linkForm.platform === p.id
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs font-semibold'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judul Tautan */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-800">
                  Judul Tautan / Label Referensi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bio Profil Instagram Utama"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 bg-white"
                />
              </div>

              {/* URL Website Tujuan */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-800">
                  URL Website Tujuan Anda
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://website-anda.com atau /promo"
                  value={linkForm.targetUrl}
                  onChange={(e) => setLinkForm({ ...linkForm, targetUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 font-mono text-xs bg-white"
                />
              </div>

              {/* Nama Kampanye UTM */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Nama Kampanye (Opsional)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">utm_campaign</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: promo_gajian atau reels_launch"
                  value={linkForm.campaignName}
                  onChange={(e) => setLinkForm({ ...linkForm, campaignName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 font-mono text-xs bg-white"
                />
              </div>

              {/* Live Preview URL */}
              {linkForm.targetUrl && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Pratinjau Tautan Terlacak:
                  </span>
                  <p className="font-mono text-[11px] text-indigo-700 break-all select-all">
                    {linkForm.targetUrl.startsWith('http') ? linkForm.targetUrl : `https://${linkForm.targetUrl}`}
                    {linkForm.targetUrl.includes('?') ? '&' : '?'}utm_source={linkForm.platform}&amp;utm_medium=bio&amp;utm_campaign={linkForm.campaignName ? linkForm.campaignName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : `bio_${linkForm.platform}`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLink}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isCreatingLink ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isCreatingLink ? 'Menyimpan...' : 'Simpan & Buat Tautan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* ============================================================= */}
      {/* MODAL: Hubungkan Akun Baru / Multi-Account dengan Label */}
      {/* ============================================================= */}
      {mounted && connectModalPlatform && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setConnectModalPlatform(null)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-xs">
                  {connectModalPlatform.iconSvg}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">
                    Hubungkan Akun {connectModalPlatform.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Workspace: <strong className="text-zinc-800">{currentProject?.name || 'Default Project'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalPlatform(null)}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnect(connectModalPlatform.id, connectAccountLabel);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-800">
                  Label Akun / Identitas Brand
                </label>
                <input
                  type="text"
                  value={connectAccountLabel}
                  onChange={(e) => setConnectAccountLabel(e.target.value)}
                  placeholder="Contoh: Akun Utama, Channel Shorts, Toko Online..."
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-900"
                  required
                />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Gunakan label ini untuk membedakan channel atau akun jika Anda mengelola beberapa akun {connectModalPlatform.name} dalam satu brand/agensi.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Otorisasi Terisolasi
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Koneksi ini akan dihubungkan secara eksklusif ke workspace <strong>{currentProject?.name}</strong>. Anda dapat memutuskan akun ini kapan saja.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setConnectModalPlatform(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={connectingPlatform === connectModalPlatform.id}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {connectingPlatform === connectModalPlatform.id ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuka Otorisasi...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lanjutkan ke {connectModalPlatform.name}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

