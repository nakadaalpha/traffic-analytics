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

  // Fetch metrics & click events untuk workspace aktif
  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId) {
      setMetrics([]);
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      const [resMetrics, resEvents] = await Promise.all([
        fetch(`/api/track/metrics?projectId=${encodeURIComponent(selectedProjectId)}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/track/events?projectId=${encodeURIComponent(selectedProjectId)}&limit=200`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (resMetrics.ok) {
        const jsonMetrics = await resMetrics.json();
        setMetrics(jsonMetrics.data || []);
      } else {
        setMetrics([]);
      }

      if (resEvents.ok) {
        const jsonEvents = await resEvents.json();
        setEvents(jsonEvents.data || []);
      } else {
        setEvents([]);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[Dashboard] Gagal memuat data metrik:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Polling Real-Time saat workspace berubah atau tab aktif
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectData();
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchProjectData();
      }
    }, 4000);

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
              Ringkasan Metrik CTA Real-Time
            </h1>
            {currentProject && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <Building2 className="w-3 h-3 text-zinc-500" />
                <span>{currentProject.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed pl-10.5">
            Pantau performa konversi klik dan CTA di seluruh halaman web secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
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

      {/* Empty State Banner jika Workspace belum ada event */}
      {!loading && metrics.length === 0 && events.length === 0 && (
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
      )}

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Klik Terkumpul */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Klik Terkumpul</span>
            <MousePointerClick className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">
            {loading && metrics.length === 0 ? '...' : totalAllClicks.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Teragregasi real-time</span>
          </div>
        </div>

        {/* Card 2: Elemen CTA Aktif */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Elemen CTA Aktif</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">
            {loading && metrics.length === 0 ? '...' : activeElementsCount}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Tombol atau link terpantau</div>
        </div>

        {/* Card 3: Top Performing CTA */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Top Performing CTA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-zinc-900 truncate" title={topResolvedName}>
            {topResolvedName}
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">
            {topCta ? `${topCta.total_clicks} klik tercatat` : 'Belum ada data'}
          </div>
        </div>

        {/* Card 4: Sinkronisasi Terakhir */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Sinkronisasi Terakhir</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-sm font-bold text-zinc-900 font-mono">
            {lastRefreshed ? lastRefreshed.toLocaleTimeString('id-ID') : '-'}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Pembaruan Otomatis Aktif</span>
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
