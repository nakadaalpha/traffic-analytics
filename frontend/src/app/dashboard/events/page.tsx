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
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
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
  country?: string;
  city?: string;
  created_at: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

function parseUserAgentDetails(ua: string | null | undefined) {
  if (!ua) {
    return { deviceType: 'Desktop' as const, os: 'Desktop', browser: 'Browser' };
  }
  const lower = ua.toLowerCase();

  // 1. Device Type & OS
  let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  let os = 'Desktop';

  if (lower.includes('ipad') || lower.includes('tablet')) {
    deviceType = 'Tablet';
    os = lower.includes('ipad') ? 'iPadOS' : 'Tablet';
  } else if (lower.includes('iphone') || lower.includes('mobile') || lower.includes('android')) {
    deviceType = 'Mobile';
    if (lower.includes('iphone')) os = 'iOS';
    else if (lower.includes('android')) os = 'Android';
    else os = 'Mobile';
  } else {
    deviceType = 'Desktop';
    if (lower.includes('macintosh') || lower.includes('mac os')) os = 'macOS';
    else if (lower.includes('windows')) os = 'Windows';
    else if (lower.includes('linux')) os = 'Linux';
    else os = 'Desktop';
  }

  // 2. Browser Detection
  let browser = 'Browser';
  if (lower.includes('edg/') || lower.includes('edge/')) browser = 'Edge';
  else if (lower.includes('chrome') && !lower.includes('chromium')) browser = 'Chrome';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('opera') || lower.includes('opr/')) browser = 'Opera';

  return { deviceType, os, browser };
}

// Helper warna brand untuk OS / Perangkat
function getOsBadgeStyle(os: string) {
  const lower = os.toLowerCase();
  if (lower.includes('mac')) {
    return 'bg-zinc-100 border-zinc-300 text-zinc-900';
  }
  if (lower.includes('windows')) {
    return 'bg-sky-50 border-sky-200 text-sky-800';
  }
  if (lower.includes('android')) {
    return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  }
  if (lower.includes('ios') || lower.includes('ipad')) {
    return 'bg-indigo-50 border-indigo-200 text-indigo-800';
  }
  if (lower.includes('linux')) {
    return 'bg-amber-50 border-amber-200 text-amber-800';
  }
  return 'bg-zinc-100 border-zinc-200 text-zinc-800';
}

// Helper warna brand resmi untuk Browser
function getBrowserBadgeStyle(browser: string) {
  const lower = browser.toLowerCase();
  if (lower.includes('chrome')) {
    return 'bg-blue-50 border-blue-200 text-blue-700 font-semibold';
  }
  if (lower.includes('safari')) {
    return 'bg-sky-50 border-sky-200 text-sky-700 font-semibold';
  }
  if (lower.includes('edge')) {
    return 'bg-teal-50 border-teal-200 text-teal-700 font-semibold';
  }
  if (lower.includes('firefox')) {
    return 'bg-orange-50 border-orange-200 text-orange-700 font-semibold';
  }
  if (lower.includes('opera')) {
    return 'bg-rose-50 border-rose-200 text-rose-700 font-semibold';
  }
  return 'bg-zinc-50 border-zinc-200 text-zinc-700';
}

// Helper aksen warna brand untuk tombol CTA sosial media
function getCtaBadgeStyle(elementId: string) {
  const lower = elementId.toLowerCase();
  if (lower.includes('whatsapp') || lower.includes('wa')) {
    return {
      pill: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      dot: 'bg-emerald-500',
      tag: 'WhatsApp',
    };
  }
  if (lower.includes('instagram') || lower.includes('ig')) {
    return {
      pill: 'bg-rose-50/80 border-rose-200 text-rose-900',
      dot: 'bg-rose-500',
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
  return {
    pill: 'bg-zinc-100 border-zinc-200 text-zinc-900',
    dot: 'bg-zinc-400',
    tag: null,
  };
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
                  {proj.name}
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
                  <th className="px-5 py-3 font-semibold">Perangkat</th>
                  <th className="px-5 py-3 font-semibold">Browser</th>
                  <th className="px-5 py-3 font-semibold">Lokasi (Edge Geo)</th>
                  <th className="px-5 py-3 font-semibold">IP Address (Masked)</th>
                  <th className="px-5 py-3 font-semibold">Session ID</th>
                  <th className="px-5 py-3 font-semibold text-right">Waktu (WIB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {events.map((evt) => {
                  const dev = parseUserAgentDetails(evt.user_agent);
                  const osStyle = getOsBadgeStyle(dev.os);
                  const browserStyle = getBrowserBadgeStyle(dev.browser);
                  const ctaStyle = getCtaBadgeStyle(evt.element_id);

                  return (
                    <tr key={evt.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">#{evt.id}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${ctaStyle.pill}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ctaStyle.dot}`} />
                          <span>{evt.element_id}</span>
                          {ctaStyle.tag && (
                            <span className="text-[9px] uppercase tracking-wider font-bold opacity-75 ml-0.5">
                              {ctaStyle.tag}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-600">{evt.page_path}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium font-mono ${osStyle}`}
                        >
                          {dev.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5" />
                          ) : dev.deviceType === 'Tablet' ? (
                            <Tablet className="w-3.5 h-3.5" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5" />
                          )}
                          <span>{dev.os}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono ${browserStyle}`}
                        >
                          {dev.browser}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-medium font-mono">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {evt.city && evt.city !== 'Unknown'
                              ? `${evt.city}, ${evt.country || 'ID'}`
                              : (evt.country || 'Indonesia (ID)')}
                          </span>
                        </span>
                      </td>
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
                  );
                })}
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
