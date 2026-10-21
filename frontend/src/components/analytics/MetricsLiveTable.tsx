'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  RotateCw, 
  Search, 
  MousePointerClick, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

export interface MetricRow {
  project_id: string;
  element_id: string;
  page_path: string;
  total_clicks: string | number;
  last_clicked_at: string;
}

interface ProjectOption {
  id: string;
  name: string;
  ownerId?: string | null;
}

export interface MetricsLiveTableProps {
  selectedProject?: string;
  onSelectProject?: (id: string) => void;
  projects?: ProjectOption[];
  metrics?: MetricRow[];
  loading?: boolean;
  lastRefreshed?: Date | null;
  onRefresh?: () => void;
}

export function MetricsLiveTable({
  selectedProject: propSelectedProject,
  onSelectProject: propOnSelectProject,
  projects: propProjects,
  metrics: propMetrics,
  loading: propLoading,
  lastRefreshed: propLastRefreshed,
  onRefresh: propOnRefresh,
}: MetricsLiveTableProps = {}) {
  const [internalMetrics, setInternalMetrics] = useState<MetricRow[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalLastRefreshed, setInternalLastRefreshed] = useState<Date | null>(null);
  const [internalProjects, setInternalProjects] = useState<ProjectOption[]>([]);
  const [internalSelectedProject, setInternalSelectedProject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isControlled = propMetrics !== undefined;

  const metrics = isControlled ? propMetrics : internalMetrics;
  const loading = isControlled ? (propLoading ?? false) : internalLoading;
  const lastRefreshed = isControlled ? (propLastRefreshed ?? null) : internalLastRefreshed;
  const projects = propProjects ?? internalProjects;
  const selectedProject = propSelectedProject ?? internalSelectedProject;
  const handleSelectProject = propOnSelectProject ?? setInternalSelectedProject;

  // 1. Ambil daftar project milik user jika tidak di-pass dari props
  const fetchUserProjects = useCallback(async () => {
    if (propProjects !== undefined) return;
    try {
      const res = await fetch('/api/track/projects', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const list: ProjectOption[] = json.data || [];
        setInternalProjects(list);
        if (list.length > 0 && !selectedProject) {
          const userProject = list.find((p) => p.ownerId !== null) || list[0];
          handleSelectProject(userProject.id);
        }
      }
    } catch (err) {
      console.warn('[LiveTable] Failed to fetch projects:', err);
    }
  }, [propProjects, selectedProject, handleSelectProject]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // 2. Ambil metrik untuk project terpilih jika mode uncontrolled
  const fetchMetrics = useCallback(async () => {
    if (isControlled) {
      if (propOnRefresh) propOnRefresh();
      return;
    }
    if (!selectedProject) return;
    try {
      setInternalLoading(true);
      const res = await fetch(`/api/track/metrics?projectId=${encodeURIComponent(selectedProject)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setInternalMetrics(json.data || []);
        setInternalLastRefreshed(new Date());
      } else {
        setInternalMetrics([]);
      }
    } catch (err) {
      console.warn('[LiveTable] Failed to fetch metrics:', err);
    } finally {
      setInternalLoading(false);
    }
  }, [isControlled, propOnRefresh, selectedProject]);

  useEffect(() => {
    if (!isControlled && selectedProject) {
      fetchMetrics();
    }

    if (!isControlled) {
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchMetrics();
        }
      }, 4000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchMetrics();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isControlled, fetchMetrics, selectedProject]);

  // Kalkulasi Ringkasan KPI
  const { totalAllClicks, maxClicks, topCta, filteredMetrics } = useMemo(() => {
    let sum = 0;
    let max = 1;
    let top: MetricRow | null = null;

    metrics.forEach((m) => {
      const count = Number(m.total_clicks) || 0;
      sum += count;
      if (count > max) max = count;
      if (!top || count > (Number(top.total_clicks) || 0)) {
        top = m;
      }
    });

    const filtered = metrics.filter(
      (m) =>
        m.element_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.page_path.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return { totalAllClicks: sum, maxClicks: max, topCta: top, filteredMetrics: filtered };
  }, [metrics, searchQuery]);

  return (
    <div className="space-y-6">
      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Total Klik Terkumpul</span>
            <MousePointerClick className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">{totalAllClicks}</div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Teragregasi real-time</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Elemen CTA Aktif</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">{metrics.length}</div>
          <div className="text-[11px] text-zinc-500">Tombol atau link terpantau</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Top Performing CTA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-zinc-900 truncate font-mono" title={(topCta as any)?.element_id || '-'}>
            {(topCta as any)?.element_id || '-'}
          </div>
          <div className="text-[11px] text-zinc-500">
            {topCta ? `${(topCta as any).total_clicks} klik tercatat` : 'Belum ada data'}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Sinkronisasi Terakhir</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-sm font-bold text-zinc-900 font-mono">
            {lastRefreshed ? lastRefreshed.toLocaleTimeString('id-ID') : '-'}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Smart Polling Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Control Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">Performa Metrik CTA Real-Time</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Data klik terisolasi per proyek dan disimpan pada Cloudflare D1.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Project Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedProject}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari tombol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        {filteredMetrics.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-zinc-800">Belum ada aktivitas klik</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Tidak ada data klik yang ditemukan untuk project{' '}
              <code className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono text-[11px]">
                {selectedProject || 'ini'}
              </code>
              . Pastikan script telah dipasang di website Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Element ID (CTA)</th>
                  <th className="px-5 py-3 font-semibold">Path Halaman</th>
                  <th className="px-5 py-3 font-semibold">Distribusi Visual</th>
                  <th className="px-5 py-3 font-semibold text-center">Total Klik</th>
                  <th className="px-5 py-3 font-semibold text-right">Terakhir Diklik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {filteredMetrics.map((row, idx) => {
                  const clickCount = Number(row.total_clicks) || 0;
                  const ratio = Math.round((clickCount / maxClicks) * 100);

                  return (
                    <tr key={`${row.project_id}-${row.element_id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-zinc-900 font-semibold">{row.element_id}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{row.project_id}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-600">{row.page_path}</td>
                      <td className="px-5 py-3.5 w-44">
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">{ratio}% dari tombol tertinggi</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-900 border border-zinc-300">
                          {row.total_clicks}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-500">
                        {new Date(row.last_clicked_at).toLocaleTimeString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Meta */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-wrap items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>GDPR IP Masking &amp; Origin Whitelist Aktif</span>
          </div>
          <div>
            Menampilkan {filteredMetrics.length} dari {metrics.length} elemen
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricsLiveTable;
