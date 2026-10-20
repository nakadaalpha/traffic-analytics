'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RotateCw, 
  FolderOpen, 
  FileText, 
  ShieldCheck, 
  Terminal, 
  Globe 
} from 'lucide-react';

interface ClickEventRow {
  id: string;
  project_id: string;
  element_id: string;
  page_path: string;
  session_id: string;
  user_id: number | null;
  user_agent: string | null;
  ip_address: string;
  created_at: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<ClickEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState('');

  // 1. Fetch daftar project milik user
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
          setSelectedProject(list[0].id);
        }
      }
    } catch (err) {
      console.warn('[EventsPage] Failed to fetch projects:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // 2. Fetch raw events
  const fetchEvents = useCallback(async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/track/events?projectId=${encodeURIComponent(selectedProject)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.warn('[EventsPage] Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      fetchEvents();
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchEvents();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchEvents, selectedProject]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-900" />
            <h1 className="text-xl font-bold text-zinc-900">Event Logs Mentah (Raw Ingestion)</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Riwayat 50 event klik terakhir untuk keperluan verifikasi dan debugging teknis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg border border-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {events.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-zinc-800">Belum ada log event mentah</div>
            <p className="text-xs text-zinc-500">
              Event tracking akan tercatat di sini secara berurutan segera setelah pengunjung mengklik tombol di website.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Element (CTA)</th>
                  <th className="px-5 py-3 font-semibold">Path Halaman</th>
                  <th className="px-5 py-3 font-semibold">IP Address (Masked)</th>
                  <th className="px-5 py-3 font-semibold">Session ID</th>
                  <th className="px-5 py-3 font-semibold text-right">Waktu (WIB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">#{evt.id}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        {evt.element_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-600">{evt.page_path}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-zinc-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-400" />
                        {evt.ip_address}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500 max-w-[140px] truncate" title={evt.session_id}>
                      {evt.session_id}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-zinc-500">
                      {new Date(evt.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kepatuhan Regulasi Privasi GDPR / UU PDP</span>
          </div>
          <div>Total {events.length} event ditampilkan</div>
        </div>
      </div>
    </div>
  );
}
