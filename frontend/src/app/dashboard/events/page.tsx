'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface ClickEventRow {
  id: string;
  project_id: string;
  element_id: string;
  page_path: string;
  session_id: string;
  user_id: number | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<ClickEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('prj_default');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/track/events?projectId=${encodeURIComponent(selectedProject)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      }
    } catch (err) {
      console.warn('[EventsPage] Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📑</span> Raw Click Events Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data event klik individual yang tersimpan di tabel <code className="text-sky-300">click_events</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="prj_default">prj_default (Default Web)</option>
            <option value="prj_shop_klien">prj_shop_klien (Demo Client)</option>
          </select>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>{loading ? '⟳ Refreshing...' : '↻ Refresh Log'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {events.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Belum ada event klik individual yang tercatat untuk project ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Element ID</th>
                  <th className="px-4 py-3">Page Path</th>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Masked IP</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-400">#{ev.id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-sky-400">
                      {ev.element_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{ev.page_path}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 truncate max-w-[120px]" title={ev.session_id}>
                      {ev.session_id}
                    </td>
                    <td className="px-4 py-3">
                      {ev.user_id ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 font-mono text-[10px]">
                          UID:{ev.user_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">anon</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{ev.ip_address}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(ev.created_at).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
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
      </div>
    </div>
  );
}
