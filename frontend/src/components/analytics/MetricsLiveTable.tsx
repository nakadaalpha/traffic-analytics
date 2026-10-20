'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface MetricRow {
  project_id: string;
  element_id: string;
  page_path: string;
  total_clicks: string | number;
  last_clicked_at: string;
}

export function MetricsLiveTable() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState('prj_default');

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/track/metrics?projectId=${encodeURIComponent(selectedProject)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn('[LiveTable] Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Live CTA Metrics (Multi-Tenant)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
              Project: {selectedProject}
            </span>
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
            <option value="prj_default">prj_default (Default Web)</option>
            <option value="prj_shop_klien">prj_shop_klien (Demo Client)</option>
          </select>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>{loading ? '⟳ Memuat...' : '↻ Segarkan'}</span>
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
          Belum ada event klik untuk project <code className="text-sky-400 font-mono">{selectedProject}</code>.
          Silakan klik tombol di Navbar, Beranda, atau Halaman Profil!
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
                <th className="px-4 py-3 font-semibold">Terakhir Diklik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics.map((row) => (
                <tr key={`${row.project_id}-${row.element_id}-${row.page_path}`} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-emerald-400 text-xs">
                    {row.project_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-sky-400 font-medium">
                    {row.element_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{row.page_path}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold text-xs">
                      {row.total_clicks}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(row.last_clicked_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastRefreshed && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
          <span className="text-emerald-400/90 font-mono">
            🛡️ IP Masking &amp; Origin Whitelist Active
          </span>
          <span>
            Sinkronisasi: {lastRefreshed.toLocaleTimeString('id-ID')}
          </span>
        </div>
      )}
    </div>
  );
}

export default MetricsLiveTable;
