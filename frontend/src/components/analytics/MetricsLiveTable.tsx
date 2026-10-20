'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface MetricRow {
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

export function MetricsLiveTable() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState('');

  // 1. Ambil daftar project milik user yang login dari API
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
          // Pilih project milik user (prioritaskan yang bukan demo jika ada)
          const userProject = list.find((p) => p.ownerId !== null) || list[0];
          setSelectedProject(userProject.id);
        }
      }
    } catch (err) {
      console.warn('[LiveTable] Failed to fetch projects:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // 2. Ambil metrik untuk project terpilih
  const fetchMetrics = useCallback(async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/track/metrics?projectId=${encodeURIComponent(selectedProject)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data || []);
        setLastRefreshed(new Date());
      } else {
        setMetrics([]);
      }
    } catch (err) {
      console.warn('[LiveTable] Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      fetchMetrics();
    }

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
  }, [fetchMetrics, selectedProject]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Live CTA Metrics (Multi-Tenant)
            </h2>
            {selectedProject && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                Project: {selectedProject}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data terisolasi secara aman per client/project di tabel <code className="text-sky-300">cta_metrics</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name} ({proj.id})
              </option>
            ))}
          </select>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{loading ? '⟳ Memuat...' : '↻ Segarkan'}</span>
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
          Belum ada event klik untuk project <code className="text-sky-400 font-mono">{selectedProject}</code>.
          Silakan pasang script dan klik tombol CTA di website Anda!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Project ID</th>
                <th className="px-4 py-3 font-semibold">Element ID</th>
                <th className="px-4 py-3 font-semibold">Page Path</th>
                <th className="px-4 py-3 font-semibold text-center">Total Clicks</th>
                <th className="px-4 py-3 font-semibold text-right">Terakhir Diklik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics.map((row, idx) => (
                <tr key={`${row.project_id}-${row.element_id}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-sky-400">{row.project_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200 font-medium">
                    {row.element_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.page_path}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {row.total_clicks}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                    {new Date(row.last_clicked_at).toLocaleTimeString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>🛡️</span>
          <span>IP Masking &amp; Origin Whitelist Active</span>
        </div>
        <div>
          {lastRefreshed ? `Sinkronisasi: ${lastRefreshed.toLocaleTimeString('id-ID')}` : 'Belum sinkron'}
        </div>
      </div>
    </div>
  );
}

export default MetricsLiveTable;
