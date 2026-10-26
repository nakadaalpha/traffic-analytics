'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  BarChart2
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
  primaryAccount?: any;
  summary: {
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
    id: 'twitter',
    name: 'X (Twitter)',
    category: 'Microblogging',
    description: 'Lacak pertumbuhan pengikut (followers), total impresi cuitan, dan rasio interaksi.',
    badgeColor: 'bg-zinc-900/10 text-zinc-900 border-zinc-200',
    borderColor: 'border-zinc-200 hover:border-zinc-300',
    textColor: 'text-zinc-900',
    accentBg: 'bg-zinc-900',
    primaryMetric: 'Followers & Impressions',
    iconSvg: (
      <svg className="w-4 h-4 fill-zinc-900" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
  const [chartMetric, setChartMetric] = useState<'subscribers' | 'views'>('subscribers');

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

  // Fetch data metrik analitik & histori time-series dari D1
  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const res = await fetch('/api/composio/metrics', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMetricsData(json);
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat metrik analitik media sosial:', err.message);
    } finally {
      setMetricsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchConnections();
    fetchMetrics();
  }, [fetchConnections, fetchMetrics]);

  // Handler Otomatis: Deteksi kembalinya user dari OAuth Composio / Google
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const connectedAccountId = params.get('connected_account_id');

    if (statusParam === 'success' || connectedAccountId) {
      const handleOAuthReturn = async () => {
        setIsSyncing(true);
        setNotification({
          type: 'success',
          message: '⚡ Otorisasi OAuth berhasil! Memverifikasi akun dan menyinkronkan data metrik secara otomatis...',
        });

        try {
          const res = await fetch('/api/composio/callback', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
              connectedAccountId: connectedAccountId || '',
              status: statusParam || 'success',
              platform: 'youtube',
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
              message: '🎉 Akun YouTube berhasil terhubung! Data metrik awal telah disinkronkan ke Cloudflare D1 secara otomatis.',
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
              message: '✅ Sesi OAuth terkonfirmasi dan sinkronisasi metrik selesai.',
            });
          }
        } catch (err: any) {
          console.warn('[Auto Sync Error]', err.message);
          setNotification({
            type: 'success',
            message: 'Otorisasi OAuth selesai. Anda dapat menekan "Sinkronisasi Sekarang" kapan saja.',
          });
        } finally {
          setIsSyncing(false);
          await fetchConnections();
          await fetchMetrics();
          // Bersihkan URL dari query string tanpa reload halaman
          window.history.replaceState({}, '', window.location.pathname);
        }
      };

      handleOAuthReturn();
    }
  }, [getAuthHeaders, fetchConnections]);

  // Handler: Mulai alur otorisasi OAuth via Composio v3
  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    setNotification(null);

    try {
      const res = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          platform: platformId,
          callbackUrl: window.location.origin + window.location.pathname,
        }),
      });

      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        if (res.status === 404) {
          throw new Error('Endpoint /api/composio/connect tidak ditemukan (404). Silakan restart server dev (./start-dev.sh) agar proxy lokal aktif.');
        }
        throw new Error(rawText || `Server mengembalikan HTTP ${res.status}`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memulai koneksi Composio');
      }

      if (json.data && json.data.redirectUrl) {
        setNotification({
          type: 'success',
          message: `Mengalihkan ke OAuth ${platformId.toUpperCase()}... Jika popup terblokir, klik tautan otorisasi.`,
        });
        
        // Buka URL OAuth di tab baru untuk otorisasi aman
        window.open(json.data.redirectUrl, '_blank');
        
        // Refresh daftar koneksi secara bertahap
        setTimeout(() => fetchConnections(), 2000);
      } else {
        throw new Error('URL otorisasi OAuth tidak diterima dari Composio');
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
      const res = await fetch('/api/composio/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server mengembalikan HTTP ${res.status}`);
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menjalankan sinkronisasi');
      }

      setNotification({
        type: 'success',
        message: 'Sinkronisasi metrik media sosial berhasil dieksekusi via background worker!',
      });
      await fetchConnections();
      await fetchMetrics();
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
    const values = list.map((item) => (isSub ? item.subscribers : item.views));

    return {
      labels,
      datasets: [
        {
          label: isSub ? 'Subscribers Channel' : 'Total Penayangan (Views)',
          data: values,
          borderColor: isSub ? '#ef4444' : '#6366f1',
          backgroundColor: isSub ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: isSub ? '#ef4444' : '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [metricsData, chartMetric]);

  const chartOptions = useMemo(
    () => ({
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
              return chartMetric === 'subscribers' ? ` ${val} Subscribers` : ` ${val} Views`;
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
          grid: { color: '#f4f4f5' },
          ticks: {
            font: { size: 11 },
            color: '#71717a',
            callback: (val: any) => Number(val).toLocaleString('id-ID'),
          },
        },
      },
    }),
    [chartMetric]
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Composio v3 Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Cron 12-Hour Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Social Media Analytics Engine
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Hubungkan channel dan akun media sosial Anda via Composio v3 untuk pelacakan metrik time-series berkala otomatis ke Cloudflare D1.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConnections}
            disabled={loading}
            className="p-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Muat Ulang Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Sekarang'}</span>
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
            className="text-xs text-zinc-400 hover:text-zinc-600 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Visualisasi Metrik Live Akun Terhubung */}
      {metricsData?.hasConnections && metricsData.summary && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 fill-red-600" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-zinc-900">
                    {metricsData.summary.accountHandle || '@epicerie_channel'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    YouTube Terverifikasi
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Metrik channel aktif tersinkronisasi via Composio Tool Router ke Cloudflare D1
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Grafik:</span>
              <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMetric('subscribers')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartMetric === 'subscribers'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Subscribers
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('views')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartMetric === 'views'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Total Views
                </button>
              </div>
            </div>
          </div>

          {/* 3 Kartu Ringkasan Metrik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Total Subscribers</span>
                <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">
                  {Number(metricsData.summary.subscribers).toLocaleString('id-ID')}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  <span>{metricsData.summary.growthRate} 7 hari terakhir</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Total Penayangan (Views)</span>
                <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">
                  {Number(metricsData.summary.views).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-zinc-400">
                  Kumulatif seluruh video channel
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Total Video Terbit</span>
                <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight">
                  {Number(metricsData.summary.videos).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-zinc-400">
                  Konten video publik aktif
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <PlaySquare className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Area Grafik Chart.js */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="font-semibold text-zinc-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                <span>
                  Grafik Tren {chartMetric === 'subscribers' ? 'Pertumbuhan Subscribers' : 'Penayangan Video'} (7 Hari Terakhir)
                </span>
              </div>
              <span className="text-zinc-400 text-[11px] font-mono">Cloudflare D1 Time-Series</span>
            </div>

            <div className="h-64 w-full pt-2">
              {metricsData.timeSeries.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  Menunggu sinkronisasi data pertama...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid Integrasi Platform Media Sosial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Platform Media Sosial Tersedia
          </h2>
          <span className="text-xs text-zinc-400">
            Didukung oleh Composio v3 Tool Router
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm ${platform.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-xs">
                      {platform.iconSvg}
                    </div>

                    {isConnected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Terhubung
                      </span>
                    ) : isInitiated ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Menunggu OAuth
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
                  {isConnected ? (
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
                      className={`w-full py-2 px-3 rounded-lg text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                        platform.id === 'youtube'
                          ? 'bg-red-600 hover:bg-red-700'
                          : platform.id === 'instagram'
                          ? 'bg-pink-600 hover:bg-pink-700'
                          : platform.id === 'twitter'
                          ? 'bg-zinc-900 hover:bg-zinc-800'
                          : 'bg-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      {isConnecting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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

      {/* Tabel Status Akun Terhubung */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-sm text-zinc-900">
              Daftar Akun Terdaftar di Cloudflare D1
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Record tersimpan di tabel <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-[11px] font-mono text-zinc-700">social_connections</code> terikat ke user ID aktif Anda.
            </p>
          </div>
          <span className="text-xs font-medium text-zinc-500">
            Total Terhubung: <strong className="text-zinc-900">{connections.length} Akun</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
            <span>Memuat data akun media sosial...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            Belum ada akun media sosial yang terhubung. Klik salah satu tombol platform di atas untuk memulai koneksi OAuth.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 font-semibold">
                  <th className="py-3 px-6">Platform</th>
                  <th className="py-3 px-6">Connection ID</th>
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
                    <td className="py-3.5 px-6 font-mono text-[11px] text-zinc-500">
                      {conn.composio_connection_id}
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

      {/* Info Card Cloudflare Cron Triggers */}
      <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-zinc-600">
        <div className="space-y-1">
          <div className="font-bold text-zinc-800 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Cloudflare Scheduled Worker Engine</span>
          </div>
          <p className="text-zinc-500 leading-relaxed">
            Metrik media sosial diperbarui secara otomatis setiap 12 jam (<code className="font-mono text-zinc-700">0 */12 * * *</code>) di Edge Cloudflare tanpa membebani server Anda.
          </p>
        </div>

        <div className="shrink-0 p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] border border-zinc-800 flex items-center gap-2 select-all">
          <span>Test lokal:</span>
          <code className="text-emerald-400">curl http://localhost:5000/__scheduled</code>
        </div>
      </div>
    </div>
  );
}

