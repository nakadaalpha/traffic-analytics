'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  RotateCw, 
  Search, 
  MousePointerClick, 
  ShieldCheck,
  Pencil,
  Tag,
  X,
  Sparkles,
  Wand2,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { resolveElementName, getBrandBadgeStyle } from '@/lib/elementNaming';

export interface MetricRow {
  project_id: string;
  element_id: string;
  page_path: string;
  total_clicks: string | number;
  last_clicked_at: string;
  display_name?: string | null;
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

// Helper untuk mengonversi timestamp SQLite (UTC) ke jam lokal secara presisi
function formatUtcToLocalTime(utcDateStr: string | null | undefined): string {
  if (!utcDateStr) return '-';
  try {
    const isoString = utcDateStr.includes('T')
      ? (utcDateStr.endsWith('Z') ? utcDateStr : `${utcDateStr}Z`)
      : `${utcDateStr.replace(' ', 'T')}Z`;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return utcDateStr;
    return d.toLocaleTimeString('id-ID');
  } catch {
    return utcDateStr;
  }
}

function parseUtcTimestampMs(utcDateStr: string | null | undefined): number {
  if (!utcDateStr) return 0;
  try {
    const isoString = utcDateStr.includes('T')
      ? (utcDateStr.endsWith('Z') ? utcDateStr : `${utcDateStr}Z`)
      : `${utcDateStr.replace(' ', 'T')}Z`;
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  } catch {
    return 0;
  }
}

// Helper aksen warna brand untuk tombol CTA sosial media (identik dengan Event Logs)
function getCtaBadgeStyle(elementId: string) {
  const lower = elementId.toLowerCase();
  if (lower.includes('whatsapp') || lower.includes('wa')) {
    return {
      pill: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      dot: 'bg-emerald-500',
      tag: 'WhatsApp',
    };
  }
  if (lower.includes('gmail') || lower.includes('email') || lower.includes('mailto')) {
    return {
      pill: 'bg-red-50/80 border-red-200 text-red-800',
      dot: 'bg-red-600',
      tag: 'Gmail',
    };
  }
  if (lower.includes('instagram') || lower.includes('ig')) {
    return {
      pill: 'bg-fuchsia-50/80 border-fuchsia-200 text-fuchsia-900',
      dot: 'bg-fuchsia-600',
      tag: 'Instagram',
    };
  }
  if (lower.includes('linkedin')) {
    return {
      pill: 'bg-sky-50/80 border-sky-200 text-sky-900',
      dot: 'bg-sky-600',
      tag: 'LinkedIn',
    };
  }
  if (lower.includes('github') || lower.includes('git')) {
    return {
      pill: 'bg-slate-100 border-slate-300 text-slate-900',
      dot: 'bg-slate-700',
      tag: 'GitHub',
    };
  }
  if (lower.includes('youtube') || lower.includes('yt')) {
    return {
      pill: 'bg-red-50/80 border-red-200 text-red-900',
      dot: 'bg-red-500',
      tag: 'YouTube',
    };
  }
  if (lower.includes('twitter') || lower.includes('x.com')) {
    return {
      pill: 'bg-zinc-100 border-zinc-300 text-zinc-900',
      dot: 'bg-zinc-900',
      tag: 'X / Twitter',
    };
  }
  if (lower.includes('telegram') || lower.includes('t.me')) {
    return {
      pill: 'bg-sky-50/80 border-sky-200 text-sky-900',
      dot: 'bg-sky-500',
      tag: 'Telegram',
    };
  }
  if (lower.includes('facebook') || lower.includes('fb')) {
    return {
      pill: 'bg-blue-50/80 border-blue-200 text-blue-900',
      dot: 'bg-blue-600',
      tag: 'Facebook',
    };
  }
  if (lower.includes('tiktok')) {
    return {
      pill: 'bg-zinc-100 border-zinc-300 text-zinc-900',
      dot: 'bg-zinc-900',
      tag: 'TikTok',
    };
  }
  return {
    pill: 'bg-zinc-100 border-zinc-200 text-zinc-900',
    dot: 'bg-zinc-400',
    tag: null,
  };
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

  // State untuk Modal Ubah Nama Tampilan (Friendly Element Name)
  const [editingRow, setEditingRow] = useState<MetricRow | null>(null);
  const [aliasInput, setAliasInput] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);

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

  // Handler Buka Modal Ubah Nama
  const handleOpenEditModal = (row: MetricRow) => {
    setEditingRow(row);
    const resolved = resolveElementName(row.element_id, row.display_name);
    setAliasInput(row.display_name || resolved.suggestion || '');
    setAliasError(null);
  };

  // Handler Simpan Nama Alias ke Backend
  const handleSaveAlias = async () => {
    if (!editingRow) return;
    try {
      setSavingAlias(true);
      setAliasError(null);
      const res = await fetch('/api/track/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: editingRow.project_id || selectedProject,
          elementId: editingRow.element_id,
          displayName: aliasInput.trim(),
        }),
      });

      let json: any = {};
      const rawText = await res.text();
      try {
        json = JSON.parse(rawText);
      } catch {
        json = {};
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || rawText || `Server error (${res.status})`);
      }

      // Update state internal langsung untuk responsivitas instan
      const updatedName = aliasInput.trim() || null;
      setInternalMetrics((prev) =>
        prev.map((m) =>
          m.element_id === editingRow.element_id && m.project_id === editingRow.project_id
            ? { ...m, display_name: updatedName }
            : m
        )
      );

      // Minta parent menyegarkan metrik jika tersedia
      if (propOnRefresh) {
        propOnRefresh();
      } else {
        fetchMetrics();
      }

      setEditingRow(null);
    } catch (err: any) {
      setAliasError(err.message || 'Terjadi kesalahan saat menyimpan nama');
    } finally {
      setSavingAlias(false);
    }
  };

  // Handler Reset Nama Alias ke Default
  const handleResetAlias = async () => {
    if (!editingRow) return;
    try {
      setSavingAlias(true);
      setAliasError(null);
      const res = await fetch('/api/track/aliases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: editingRow.project_id || selectedProject,
          elementId: editingRow.element_id,
        }),
      });

      let json: any = {};
      const rawText = await res.text();
      try {
        json = JSON.parse(rawText);
      } catch {
        json = {};
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || rawText || `Server error (${res.status})`);
      }

      setInternalMetrics((prev) =>
        prev.map((m) =>
          m.element_id === editingRow.element_id && m.project_id === editingRow.project_id
            ? { ...m, display_name: null }
            : m
        )
      );

      if (propOnRefresh) {
        propOnRefresh();
      } else {
        fetchMetrics();
      }

      setEditingRow(null);
    } catch (err: any) {
      setAliasError(err.message || 'Terjadi kesalahan saat mereset nama');
    } finally {
      setSavingAlias(false);
    }
  };

  // State Filter & Sorting untuk Rekapitulasi Metrik
  const [ctaCategoryFilter, setCtaCategoryFilter] = useState<'all' | 'social'>('all');
  const [sortColumn, setSortColumn] = useState<'clicks' | 'element_id' | 'time'>('clicks');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Handler interaktif pengurutan (Sorting)
  const handleSort = (column: 'clicks' | 'element_id' | 'time') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'element_id' ? 'asc' : 'desc');
    }
  };

  // Hitung jumlah metrik sosial media
  const socialMetricsCount = useMemo(() => {
    return metrics.filter((m) => Boolean(getCtaBadgeStyle(m.element_id).tag)).length;
  }, [metrics]);

  // Kalkulasi maxClicks dan filteredMetrics dengan filter & sorting dinamis
  const { maxClicks, filteredMetrics } = useMemo(() => {
    let max = 1;

    metrics.forEach((m) => {
      const count = Number(m.total_clicks) || 0;
      if (count > max) max = count;
    });

    const list = metrics.filter((m) => {
      // Filter kategori sosial media
      if (ctaCategoryFilter === 'social' && !getCtaBadgeStyle(m.element_id).tag) {
        return false;
      }

      // Filter kata kunci pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const resolved = resolveElementName(m.element_id, m.display_name);
        const matchId = (m.element_id || '').toLowerCase().includes(q);
        const matchName = (resolved.displayName || '').toLowerCase().includes(q);
        const matchPath = (m.page_path || '').toLowerCase().includes(q);
        const matchTag = (getCtaBadgeStyle(m.element_id).tag || '').toLowerCase().includes(q);
        return matchId || matchName || matchPath || matchTag;
      }

      return true;
    });

    // Sorting interaktif
    list.sort((a, b) => {
      if (sortColumn === 'clicks') {
        const clicksA = Number(a.total_clicks) || 0;
        const clicksB = Number(b.total_clicks) || 0;
        return sortDirection === 'asc' ? clicksA - clicksB : clicksB - clicksA;
      } else if (sortColumn === 'element_id') {
        const nameA = resolveElementName(a.element_id, a.display_name).displayName;
        const nameB = resolveElementName(b.element_id, b.display_name).displayName;
        const cmp = nameA.localeCompare(nameB);
        return sortDirection === 'asc' ? cmp : -cmp;
      } else {
        const timeA = parseUtcTimestampMs(a.last_clicked_at);
        const timeB = parseUtcTimestampMs(b.last_clicked_at);
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });

    return { maxClicks: max, filteredMetrics: list };
  }, [metrics, searchQuery, ctaCategoryFilter, sortColumn, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Control Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">Rekapitulasi Performa &amp; Konversi CTA</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Akumulasi total klik per elemen, rasio visual terhadap performa tertinggi, dan manajemen alias nama.
            </p>
          </div>
        </div>

        {/* Toolbar: Filter Kategori Tombol & Pencarian Cepat (Identik dengan Event Logs) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50/80 border-b border-zinc-200">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-xs text-xs">
              <button
                type="button"
                onClick={() => setCtaCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  ctaCategoryFilter === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>Semua Tombol</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    ctaCategoryFilter === 'all'
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {metrics.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCtaCategoryFilter('social')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  ctaCategoryFilter === 'social'
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>Hanya Sosial Media</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    ctaCategoryFilter === 'social'
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {socialMetricsCount}
                </span>
              </button>
            </div>

            {/* Reset Filter Button */}
            {(ctaCategoryFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setCtaCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3 h-3 text-zinc-400" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Quick Search Input with Clear Button */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari tombol atau path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-7 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        {filteredMetrics.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-zinc-800">
              {metrics.length === 0 ? 'Belum ada aktivitas klik' : 'Tidak ada data yang cocok'}
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {metrics.length === 0 ? (
                <>
                  Tidak ada data klik yang ditemukan untuk project{' '}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono text-[11px]">
                    {selectedProject || 'ini'}
                  </code>
                  . Pastikan script telah dipasang di website Anda.
                </>
              ) : (
                <>Tidak ada elemen CTA yang sesuai dengan filter atau kata kunci pencarian Anda.</>
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200 select-none">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => handleSort('element_id')}
                      className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-semibold cursor-pointer group"
                      title="Urutkan berdasarkan nama tombol"
                    >
                      <span>Nama Tombol / Elemen (CTA)</span>
                      {sortColumn === 'element_id' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-zinc-900" /> : <ArrowDown className="w-3 h-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3 font-semibold">Path Halaman</th>
                  <th className="px-5 py-3 font-semibold">Distribusi Visual</th>
                  <th className="px-5 py-3 font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('clicks')}
                      className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-semibold cursor-pointer group"
                      title="Urutkan berdasarkan total klik"
                    >
                      <span>Total Klik</span>
                      {sortColumn === 'clicks' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-zinc-900" /> : <ArrowDown className="w-3 h-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3 font-semibold text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('time')}
                      className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-semibold cursor-pointer group ml-auto"
                      title="Urutkan berdasarkan waktu terakhir diklik"
                    >
                      <span>Terakhir Diklik</span>
                      {sortColumn === 'time' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-zinc-900" /> : <ArrowDown className="w-3 h-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {filteredMetrics.map((row, idx) => {
                  const clickCount = Number(row.total_clicks) || 0;
                  const ratio = Math.round((clickCount / maxClicks) * 100);
                  const resolved = resolveElementName(row.element_id, row.display_name);
                  const badge = getCtaBadgeStyle(row.element_id);

                  return (
                    <tr key={`${row.project_id}-${row.element_id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {badge.tag && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.pill}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                  <span>{badge.tag}</span>
                                </span>
                              )}
                              {resolved.isCustom ? (
                                <span className="text-xs font-semibold text-zinc-900 truncate">
                                  {resolved.displayName}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-zinc-900 font-mono truncate">
                                  {resolved.displayName}
                                </span>
                              )}
                              {resolved.isCustom && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                  Kustom
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                              <span>#{row.element_id}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all cursor-pointer shrink-0 opacity-80 group-hover:opacity-100"
                            title="Ubah nama tampilan tombol ini"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-600">{row.page_path}</td>
                      <td className="px-5 py-3.5 w-48">
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(4, ratio)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                            <span>{ratio}% dari tombol tertinggi</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-900 border border-zinc-300">
                          {row.total_clicks}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-500">
                        {formatUtcToLocalTime(row.last_clicked_at)}
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

      {/* Modal Dialog: Ubah Nama Tampilan Tombol */}
      {editingRow && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !savingAlias && setEditingRow(null)}
        >
          <div 
            className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Ubah Nama Tampilan Tombol</h3>
                  <p className="text-[11px] text-zinc-500">Beri nama ramah agar mudah dibaca di analitik</p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingAlias}
                onClick={() => setEditingRow(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="font-medium">Element ID Asli</span>
                  <span className="font-mono text-[10px] text-zinc-400">Proyek: {editingRow.project_id}</span>
                </div>
                <div className="font-mono font-semibold text-zinc-900 bg-white px-2 py-1 rounded border border-zinc-200 text-xs">
                  #{editingRow.element_id}
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-2 pt-0.5">
                  <span>Path: <code className="font-mono">{editingRow.page_path}</code></span>
                  <span>&bull;</span>
                  <span>Total: <strong>{editingRow.total_clicks} klik</strong></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-display-name-input" className="block font-semibold text-zinc-800">
                    Nama Tampilan Baru (Friendly Name)
                  </label>
                  {(() => {
                    const resolved = resolveElementName(editingRow.element_id, editingRow.display_name);
                    if (resolved.suggestion && resolved.suggestion !== aliasInput) {
                      return (
                        <button
                          type="button"
                          onClick={() => setAliasInput(resolved.suggestion)}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          title="Klik untuk mengisi saran otomatis dari sistem"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Gunakan Saran: &quot;{resolved.suggestion}&quot;</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <input
                  id="custom-display-name-input"
                  type="text"
                  placeholder="Contoh: WhatsApp CS Konsultasi, Tombol Checkout Utama..."
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  Nama ini akan menggantikan ID teknis di seluruh tabel analitik dan diagram ringkasan dashboard.
                </p>
              </div>

              {aliasError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {aliasError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 gap-2">
              <div>
                {editingRow.display_name && (
                  <button
                    type="button"
                    disabled={savingAlias}
                    onClick={handleResetAlias}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Reset ke Default
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingAlias}
                  onClick={() => setEditingRow(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingAlias}
                  onClick={handleSaveAlias}
                  className="px-4 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {savingAlias && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingAlias ? 'Menyimpan...' : 'Simpan Nama'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricsLiveTable;
