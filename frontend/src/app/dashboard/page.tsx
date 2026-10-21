'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MetricsLiveTable, { MetricRow, MetricsLiveTableProps } from '@/components/analytics/MetricsLiveTable';
import AnalyticsChartJsDemo, { ClickEventRow } from '@/components/analytics/AnalyticsChartJsDemo';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Database,
  FolderOpen,
  RotateCw,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  name: string;
  ownerId?: string | null;
}

export default function DashboardOverviewPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [events, setEvents] = useState<ClickEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // 1. Fetch user's projects
  const fetchUserProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/track/projects', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const list: ProjectOption[] = json.data || [];
        setProjects(list);
        if (list.length > 0 && !selectedProject) {
          const userProject = list.find((p) => p.ownerId !== null) || list[0];
          setSelectedProject(userProject.id);
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch projects:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // 2. Fetch metrics & click events for the selected project
  const fetchProjectData = useCallback(async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const [resMetrics, resEvents] = await Promise.all([
        fetch(`/api/track/metrics?projectId=${encodeURIComponent(selectedProject)}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/track/events?projectId=${encodeURIComponent(selectedProject)}&limit=200`, {
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
      console.warn('[Dashboard] Failed to fetch metrics/events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
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
  }, [fetchProjectData, selectedProject]);

  const activeProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Global Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-800" />
            <span>Ringkasan Metrik CTA Real-Time</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Pantau performa konversi klik dan CTA di seluruh halaman web secara otomatis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Global Project Selector */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
              <FolderOpen className="w-4 h-4 text-zinc-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Proyek Terpilih
                </span>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer pr-1"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="px-3 py-2 text-xs bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg border border-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lihat Halaman Demo</span>
          </Link>

          <button
            type="button"
            onClick={fetchProjectData}
            disabled={loading}
            className="px-3 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Segarkan data secara manual"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Metode Pengiriman</span>
            <Zap className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>Beacon API</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Active
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Fallback otomatis ke Keepalive Fetch</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Respons Backend</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            204 No Content
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Non-blocking / 0ms client wait time</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Model Agregasi</span>
            <Database className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            Atomic UPSERT
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Cloudflare D1 ON CONFLICT UPDATE</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Privasi Pengunjung</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            IP Masking
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">GDPR &amp; Standar UU PDP</div>
        </div>
      </div>

      {/* Chart.js Analytics Visualization Section (100% Real-Time Connected) */}
      <AnalyticsChartJsDemo
        projectId={selectedProject}
        projectName={activeProject?.name}
        metrics={metrics}
        events={events}
        loading={loading}
      />

      {/* Live Table Section (Synchronized) */}
      <MetricsLiveTable
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        projects={projects}
        metrics={metrics}
        loading={loading}
        lastRefreshed={lastRefreshed}
        onRefresh={fetchProjectData}
      />
    </div>
  );
}
