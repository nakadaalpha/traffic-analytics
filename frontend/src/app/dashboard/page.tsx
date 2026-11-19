'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import MetricsLiveTable, { MetricRow } from '@/components/analytics/MetricsLiveTable';
import AnalyticsChartJsDemo, { ClickEventRow } from '@/components/analytics/AnalyticsChartJsDemo';
import {
  BarChart3,
  CheckCircle2,
  RotateCw,
  MousePointerClick,
  TrendingUp,
  Clock,
  Building2,
  Share2,
  MessageSquare,
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { resolveElementName } from '@/lib/elementNaming';
import { useProject } from '@/context/ProjectContext';

export default function DashboardOverviewPage() {
  const { currentProject, projects } = useProject();
  const selectedProjectId = currentProject?.id || '';

  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [events, setEvents] = useState<ClickEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filter Rentang Waktu Global
  const [periodFilter, setPeriodFilter] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Executive High-Level Summaries
  const [socialSummary, setSocialSummary] = useState<{
    totalFollowers: number;
    totalViews: number;
    totalPosts: number;
    connectedCount: number;
    platform?: string;
  } | null>(null);

  const [leadsSummary, setLeadsSummary] = useState<{
    totalLeads: number;
    newToday: number;
    followUpDueToday: number;
    totalRevenue: number;
    qualifiedRate: string;
  } | null>(null);

  // Fetch metrics & click events untuk workspace aktif dengan dukungan filter waktu global
  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId) {
      setMetrics([]);
      setEvents([]);
      setSocialSummary(null);
      setLeadsSummary(null);
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({ projectId: selectedProjectId });
      if (periodFilter && periodFilter !== 'all') params.append('period', periodFilter);
      if (periodFilter === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }
      const qs = `?${params.toString()}`;

      // Parallel Non-Blocking Hydration: Muat metrik Web, Sosmed, dan Leads secara serentak
      const [resMetrics, resEvents, resSocial, resLeads] = await Promise.allSettled([
        fetch(`/api/track/metrics${qs}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/track/events${qs}&limit=200`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/composio/metrics${qs}`, { credentials: 'include' }),
        fetch(`/api/composio/leads${qs}`, { credentials: 'include' }),
      ]);

      if (resMetrics.status === 'fulfilled' && resMetrics.value.ok) {
        const jsonMetrics = await resMetrics.value.json().catch(() => ({}));
        setMetrics(jsonMetrics.data || []);
      } else {
        setMetrics([]);
      }

      if (resEvents.status === 'fulfilled' && resEvents.value.ok) {
        const jsonEvents = await resEvents.value.json().catch(() => ({}));
        setEvents(jsonEvents.data || []);
      } else {
        setEvents([]);
      }

      if (resSocial.status === 'fulfilled' && resSocial.value.ok) {
        const jsonSocial = await resSocial.value.json().catch(() => ({}));
        if (jsonSocial.success) {
          const s = jsonSocial.summary || {};
          const conns = Array.isArray(jsonSocial.connections) ? jsonSocial.connections : [];
          setSocialSummary({
            totalFollowers: Number(s.subscribers || s.followers || 0),
            totalViews: Number(s.views || 0),
            totalPosts: Number(s.posts || 0),
            connectedCount: conns.filter((c: any) => c.status === 'ACTIVE').length,
            platform: s.platform || conns[0]?.platform,
          });
        }
      }

      if (resLeads.status === 'fulfilled' && resLeads.value.ok) {
        const jsonLeads = await resLeads.value.json().catch(() => ({}));
        if (jsonLeads.success && jsonLeads.data?.stats) {
          const st = jsonLeads.data.stats;
          setLeadsSummary({
            totalLeads: Number(st.totalLeads || 0),
            newToday: Number(st.newToday || 0),
            followUpDueToday: Number(st.followUpDueToday || 0),
            totalRevenue: Number(st.totalRevenue || 0),
            qualifiedRate: st.qualifiedRate || '0.0%',
          });
        }
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[Dashboard] Gagal memuat data metrik:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, periodFilter, customStartDate, customEndDate]);

  // Polling Real-Time saat workspace berubah atau tab aktif
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectData();
    }

    // Smart Polling Interval: 20 detik (hemat 80% network overhead, auto-refresh saat tab aktif)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchProjectData();
      }
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProjectData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProjectData, selectedProjectId]);

  // Kalkulasi Ringkasan KPI Dinamis
  const { totalAllClicks, activeElementsCount, topCta, topResolvedName } = useMemo(() => {
    let sum = 0;
    let top: MetricRow | null = null;

    for (const m of metrics) {
      const count = Number(m.total_clicks) || 0;
      sum += count;
      if (!top || count > (Number(top.total_clicks) || 0)) {
        top = m;
      }
    }

    const topResolved = top ? resolveElementName(top.element_id, top.display_name) : null;

    return {
      totalAllClicks: sum,
      activeElementsCount: metrics.length,
      topCta: top as MetricRow | null,
      topResolvedName: topResolved?.displayName || '-',
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Ringkasan Eksekutif Bisnis
            </h1>
            {currentProject && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <Building2 className="w-3 h-3 text-zinc-500" />
                <span>{currentProject.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed pl-10.5">
            Pusat komando terpadu untuk memantau konversi website, pertumbuhan audiens media sosial, dan prospek leads bisnis Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Global Period Selector */}
          <div className="h-9 flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer pr-1"
              title="Filter rentang waktu analitik eksekutif"
            >
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="all">Semua Waktu</option>
              <option value="custom">Kustom Rentang...</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchProjectData}
            disabled={loading}
            className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            title="Segarkan data secara manual"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Strip Rentang Tanggal Kustom */}
      {periodFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
          <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            Rentang Waktu Kustom:
          </span>
          <div className="flex items-center gap-1.5">
            <label className="text-zinc-500 text-[11px]">Dari:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-zinc-500 text-[11px]">Sampai:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <button
            type="button"
            onClick={fetchProjectData}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-md text-xs transition-colors cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Smart Banner jika Workspace belum terhubung ke Website (Social/Leads Mode) */}
      {currentProject && (!currentProject.allowedOrigins || currentProject.allowedOrigins.length === 0) ? (
        <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-zinc-900">
                  Workspace &ldquo;{currentProject.name}&rdquo; Aktif untuk Media Sosial &amp; Inbound Leads
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Sosmed &amp; Leads
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xl">
                Workspace ini belum terhubung ke website. Anda dapat langsung mengelola <strong>Analitik Media Sosial</strong> (TikTok, YouTube, IG) dan <strong>Pesan Leads Masuk</strong> (WhatsApp, DM, Gmail). Anda juga dapat menghubungkan domain website kapan saja.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href="/dashboard/social"
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Analitik Sosmed</span>
            </Link>
            <Link
              href="/dashboard/leads"
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Leads &amp; DM</span>
            </Link>
            <Link
              href="/dashboard/projects"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
            >
              + Hubungkan Website
            </Link>
          </div>
        </div>
      ) : (
        /* Empty State Banner jika Workspace Web belum ada event */
        !loading && metrics.length === 0 && events.length === 0 && (
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-zinc-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <MousePointerClick className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-900">
                  Workspace &ldquo;{currentProject?.name || 'Aktif'}&rdquo; belum memiliki data event tracking
                </h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xl">
                  Pasang script tracker di website Anda atau salin kode tombol CTA dari menu <strong>Manajemen & Integrasi</strong> untuk mulai merekam klik. Anda juga dapat beralih ke workspace lain di navbar atas.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/projects"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Panduan Pasang Tracker</span>
            </Link>
          </div>
        )
      )}

      {/* 4-Pillar Executive Cockpit Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: Konversi Web (Klik CTA) */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Konversi Web (CTA)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {loading && metrics.length === 0 ? '...' : totalAllClicks.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate" title={topCta ? `Top: ${topResolvedName} (${topCta.total_clicks} klik)` : `${activeElementsCount} elemen CTA terpantau`}>
                {topCta ? (
                  <span>Top: <strong className="text-zinc-700 font-medium">{topResolvedName}</strong> ({topCta.total_clicks})</span>
                ) : (
                  <span>{activeElementsCount} elemen CTA aktif</span>
                )}
              </p>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">{activeElementsCount} tombol</span>
            <Link
              href="/dashboard/events"
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Log Event</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pilar 2: Audiens Media Sosial */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Audiens Sosmed</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {loading && !socialSummary ? '...' : (socialSummary?.totalFollowers || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {(socialSummary?.totalViews || 0).toLocaleString('id-ID')} total tayangan
              </p>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">{socialSummary?.connectedCount || 0} akun aktif</span>
            <Link
              href="/dashboard/social"
              className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Kelola Sosmed</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pilar 3: Prospek Masuk (Leads) */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prospek Masuk (Leads)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {loading && !leadsSummary ? '...' : (leadsSummary?.totalLeads || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {leadsSummary?.newToday || 0} baru • {leadsSummary?.qualifiedRate || '0%'} qualified
              </p>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">WhatsApp &amp; DM</span>
            <Link
              href="/dashboard/leads"
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Pipeline CRM</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pilar 4: Estimasi Pipeline Deal */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between group">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Nilai Pipeline Deal</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {loading && !leadsSummary
                  ? '...'
                  : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                      leadsSummary?.totalRevenue || 0
                    )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {leadsSummary?.followUpDueToday || 0} follow-up jatuh tempo
              </p>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-mono text-[10px]">
              {lastRefreshed ? `Sync: ${lastRefreshed.toLocaleTimeString('id-ID')}` : 'Sync: -'}
            </span>
            <Link
              href="/dashboard/leads"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Detail Deal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Chart.js Analytics Visualization Section */}
      <AnalyticsChartJsDemo
        projectId={selectedProjectId}
        projectName={currentProject?.name}
        metrics={metrics}
        events={events}
        loading={loading}
      />

      {/* Live Table Section */}
      <MetricsLiveTable
        selectedProject={selectedProjectId}
        projects={projects}
        metrics={metrics}
        loading={loading}
        lastRefreshed={lastRefreshed}
        onRefresh={fetchProjectData}
      />
    </div>
  );
}
