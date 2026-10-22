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
  Wand2
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

  // Kalkulasi maxClicks dan filteredMetrics
  const { maxClicks, filteredMetrics } = useMemo(() => {
    let max = 1;

    metrics.forEach((m) => {
      const count = Number(m.total_clicks) || 0;
      if (count > max) max = count;
    });

    const filtered = metrics.filter((m) => {
      const resolved = resolveElementName(m.element_id, m.display_name);
      const q = searchQuery.toLowerCase().trim();
      return (
        m.element_id.toLowerCase().includes(q) ||
        resolved.displayName.toLowerCase().includes(q) ||
        m.page_path.toLowerCase().includes(q)
      );
    });

    return { maxClicks: max, filteredMetrics: filtered };
  }, [metrics, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Control Header */}
        <div className="p-5 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">Performa Metrik CTA Real-Time</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Data agregasi klik CTA dan konversi per halaman web.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari tombol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono"
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
                  <th className="px-5 py-3 font-semibold">Nama Tombol / Elemen (CTA)</th>
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
                  const resolved = resolveElementName(row.element_id, row.display_name);
                  const brandStyle = getBrandBadgeStyle(resolved.brandLabel);

                  return (
                    <tr key={`${row.project_id}-${row.element_id}-${idx}`} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            {resolved.isCustom ? (
                              <>
                                <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5 truncate">
                                  <span>{resolved.displayName}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                    Kustom
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                                  <span>#{row.element_id}</span>
                                </div>
                              </>
                            ) : resolved.isAutoNamed ? (
                              <>
                                <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5 truncate">
                                  <span>{resolved.displayName}</span>
                                  <span 
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full border font-medium flex items-center gap-1 ${brandStyle.pill}`}
                                    title="Nama diformat otomatis oleh sistem berdasarkan jenis sosial media"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${brandStyle.dot}`} />
                                    <span>Auto</span>
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                                  <span>#{row.element_id}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-mono text-zinc-900 font-semibold text-xs">
                                  {row.element_id}
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono">
                                  {row.project_id}
                                </div>
                              </>
                            )}
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
