'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Copy, 
  Check, 
  FolderCheck, 
  Terminal, 
  Code2, 
  Globe, 
  Key, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
  createdAt?: string;
}

interface FrameworkSnippet {
  id: string;
  name: string;
  fileTarget: string;
  getCode: (projectId: string, writeKey: string) => string;
  note?: string;
}

const FRAMEWORK_SNIPPETS: FrameworkSnippet[] = [
  {
    id: 'vite',
    name: 'React (Vite)',
    fileTarget: 'index.html (di folder root)',
    getCode: (pid, key) => `<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Website Saya</title>

    <!-- ClickTracker Script -->
    <script
      defer
      data-project-id="${pid}"
      data-write-key="${key}"
      src="https://traffic-analytics-taupe.vercel.app/tracker.js">
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    note: 'Otomatis mendukung localhost:5173 saat pengujian lokal.',
  },
  {
    id: 'next-app',
    name: 'Next.js (App Router)',
    fileTarget: 'app/layout.tsx atau src/app/layout.tsx',
    getCode: (pid, key) => `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <Script
          defer
          data-project-id="${pid}"
          data-write-key="${key}"
          src="https://traffic-analytics-taupe.vercel.app/tracker.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    note: 'strategy="afterInteractive" memastikan kecepatan FCP website tidak terganggu.',
  },
  {
    id: 'html',
    name: 'HTML / PHP / WordPress',
    fileTarget: 'index.html / header.php / theme.liquid',
    getCode: (pid, key) => `<!-- Sisipkan sebelum </head> atau sebelum </body> -->
<script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  src="https://traffic-analytics-taupe.vercel.app/tracker.js">
</script>`,
    note: 'Bisa ditempelkan di CMS apa pun (WordPress, Webflow, Blogger, Shopify, Laravel).',
  },
  {
    id: 'vue',
    name: 'Vue / Nuxt 3',
    fileTarget: 'index.html (Vue) atau nuxt.config.ts (Nuxt)',
    getCode: (pid, key) => `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          defer: true,
          'data-project-id': '${pid}',
          'data-write-key': '${key}',
          src: 'https://traffic-analytics-taupe.vercel.app/tracker.js',
        },
      ],
    },
  },
});`,
  },
  {
    id: 'astro',
    name: 'Astro',
    fileTarget: 'src/layouts/Layout.astro',
    getCode: (pid, key) => `---
// src/layouts/Layout.astro
---
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <script
      defer
      data-project-id="${pid}"
      data-write-key="${key}"
      src="https://traffic-analytics-taupe.vercel.app/tracker.js"
    ></script>
  </head>
  <body>
    <slot />
  </body>
</html>`,
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(FRAMEWORK_SNIPPETS[0].id);

  // Form State untuk Tambah Project Baru
  const [projectName, setProjectName] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch daftar project milik user langsung dari D1
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/track/projects', {
        credentials: 'include',
        cache: 'no-store',
      });
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
        credentials: 'include',
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

  const activeSnippet = FRAMEWORK_SNIPPETS.find((f) => f.id === selectedFramework) || FRAMEWORK_SNIPPETS[0];
  const currentPid = selectedProject?.id || 'PROJECT_ID_ANDA';
  const currentKey = selectedProject?.writeKey || 'WRITE_KEY_ANDA';
  const displayCode = activeSnippet.getCode(currentPid, currentKey);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-zinc-900">
          <Layers className="w-5 h-5 text-zinc-900" />
          <h1 className="text-xl font-bold">Manajemen Project &amp; Pemasangan Script</h1>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Daftarkan website baru Anda dan dapatkan panduan kode siap pakai untuk framework apa pun.
        </p>
      </div>

      {/* Formulir Tambah Project Baru */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-zinc-700" />
          <span>Daftarkan Website Baru</span>
        </h2>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleCreateProject} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Nama Website / Project</label>
            <input
              type="text"
              placeholder="Contoh: Portfolio Saya / Toko Online"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
              required
            />
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Domain Website</label>
            <input
              type="text"
              placeholder="Contoh: https://myportofolio.vercel.app"
              value={projectDomain}
              onChange={(e) => setProjectDomain(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors font-mono"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer h-[38px] flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : 'Buat Project'}
            </button>
          </div>
        </form>
      </div>

      {/* Script Tag Snippet Generator per Framework */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-zinc-800" />
              <span>Panduan Pasang Script per Framework</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Pilih framework website Anda di bawah ini, lalu salin kodenya ke file yang ditentukan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 font-medium">Pilih Project:</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selector Framework */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3">
          {FRAMEWORK_SNIPPETS.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => setSelectedFramework(fw.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFramework === fw.id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              {fw.name}
            </button>
          ))}
        </div>

        {/* Lokasi File Target */}
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span>Tempelkan di file:</span>
            <code className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[11px] font-semibold">
              {activeSnippet.fileTarget}
            </code>
          </div>
          {activeSnippet.note && (
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {activeSnippet.note}
            </span>
          )}
        </div>

        {/* Code Block Container */}
        <div className="relative group">
          <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">
            {displayCode}
          </pre>

          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Panduan Menandai Tombol */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-600 space-y-2">
          <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-zinc-500" />
            <span>Langkah 2: Tandai Tombol yang Ingin Dihitung Kliknya</span>
          </div>
          <p className="text-zinc-500">
            Tambahkan atribut <code className="text-zinc-900 font-mono font-semibold bg-zinc-200 px-1 py-0.5 rounded">data-track-cta="nama_tombol"</code> pada tombol, link WhatsApp, atau form di website Anda:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
              <span className="text-[11px] text-zinc-400 block mb-1">Contoh Link WhatsApp:</span>
              <code className="text-zinc-800 font-mono text-[11px] block overflow-x-auto">
                &lt;a href=&quot;https://wa.me/...&quot; data-track-cta=&quot;btn-whatsapp&quot;&gt;Chat WhatsApp&lt;/a&gt;
              </code>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
              <span className="text-[11px] text-zinc-400 block mb-1">Contoh Tombol Checkout:</span>
              <code className="text-zinc-800 font-mono text-[11px] block overflow-x-auto">
                &lt;button data-track-cta=&quot;btn-checkout&quot;&gt;Beli Sekarang&lt;/button&gt;
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Project Milik Anda */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <FolderCheck className="w-4 h-4 text-zinc-700" />
          <span>Daftar Project Aktif Milik Anda ({projects.length})</span>
        </h3>

        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-400">Memuat data project...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className={`bg-white border rounded-xl p-5 shadow-sm space-y-3.5 transition-all cursor-pointer ${
                  selectedProject?.id === proj.id
                    ? 'border-zinc-900 ring-1 ring-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{proj.name}</h4>
                    <span className="font-mono text-xs text-zinc-500">{proj.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Aktif
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-600">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Key className="w-3 h-3 text-zinc-400" />
                      Public Write Key:
                    </span>
                    <code className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[11px] block">
                      {proj.writeKey}
                    </code>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      Domain Terdaftar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.allowedOrigins.map((orig) => (
                        <span
                          key={orig}
                          className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[11px]"
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
