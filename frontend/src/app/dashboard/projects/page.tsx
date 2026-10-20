'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ProjectData {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
  createdAt?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State untuk Tambah Project Baru
  const [projectName, setProjectName] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch daftar project langsung dari database D1
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/track/projects', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const list: ProjectData[] = json.data || [];
        setProjects(list);
        if (list.length > 0 && !selectedProject) {
          setSelectedProject(list[0]);
        }
      }
    } catch (err) {
      console.warn('[ProjectsPage] Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle pembuatan project baru
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDomain.trim()) {
      setMessage({ type: 'error', text: 'Nama project dan domain wajib diisi!' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/track/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          domain: projectDomain.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `Project "${projectName}" berhasil didaftarkan!` });
        setProjectName('');
        setProjectDomain('');
        // Refresh project list dan otomatis pilih project yang baru dibuat
        const newProj = json.data;
        setProjects((prev) => [newProj, ...prev]);
        setSelectedProject(newProj);
      } else {
        setMessage({ type: 'error', text: json.error || 'Gagal membuat project' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan jaringan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackerScriptSnippet = selectedProject
    ? `<script
  defer
  data-project-id="${selectedProject.id}"
  data-write-key="${selectedProject.writeKey}"
  src="https://traffic-analytics-taupe.vercel.app/tracker.js">
</script>`
    : '<!-- Pilih atau buat project terlebih dahulu -->';

  const copyToClipboard = () => {
    if (!selectedProject) return;
    navigator.clipboard.writeText(trackerScriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📦</span> Manajemen Project &amp; Pemasangan Script
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Daftarkan website baru Anda dan dapatkan tag script 1-baris universal untuk langsung dipasang.
        </p>
      </div>

      {/* Formulir Tambah Project Baru (Mirip YouTube / Google Analytics) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-7 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>➕</span> Daftarkan Website Baru Anda
        </h2>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              message.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/70 border-rose-800 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama Website / Project</label>
            <input
              type="text"
              placeholder="Contoh: Toko Baju Online"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-slate-300">Domain URL (Allowed Origin)</label>
            <input
              type="text"
              placeholder="Contoh: https://tokobaju.com"
              value={projectDomain}
              onChange={(e) => setProjectDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer h-[38px] flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : 'Buat Project'}
            </button>
          </div>
        </form>
      </div>

      {/* Script Tag Snippet Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span> Universal Tracking Script Tag
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy tag script ini dan letakkan di dalam <code className="text-sky-400">&lt;head&gt;</code> atau sebelum <code className="text-sky-400">&lt;/body&gt;</code> website Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Pilih Project:</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative group">
          <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto selection:bg-emerald-900 leading-relaxed">
            {trackerScriptSnippet}
          </pre>

          {selectedProject && (
            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
            >
              {copied ? (
                <>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Salin Script</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span>💡</span> Cara Melacak Tombol:
          </div>
          <p className="text-slate-400">
            Cukup tambahkan atribut <code className="text-sky-300 font-mono">data-track-cta="nama_tombol"</code> pada tombol atau link di website Anda:
          </p>
          <div className="pt-1">
            <code className="text-amber-300 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 block w-fit">
              &lt;button data-track-cta="order-now-btn"&gt;Pesan Sekarang&lt;/button&gt;
            </code>
          </div>
        </div>
      </div>

      {/* Grid Project Terdaftar */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📁</span> Daftar Project Aktif di Cloudflare D1 ({projects.length})
        </h3>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Memuat data project...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className={`bg-slate-900 border rounded-xl p-5 shadow-lg space-y-4 transition-all cursor-pointer ${
                  selectedProject?.id === proj.id ? 'border-sky-500 ring-1 ring-sky-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">{proj.name}</h4>
                    <span className="font-mono text-xs text-sky-400">{proj.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-semibold">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Public Write Key:</span>
                    <code className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-300 font-mono block">
                      {proj.writeKey}
                    </code>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Allowed Domain Origins:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.allowedOrigins.map((orig) => (
                        <span
                          key={orig}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]"
                        >
                          {orig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
