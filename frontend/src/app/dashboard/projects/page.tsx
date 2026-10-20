'use client';

import React, { useState } from 'react';

interface ProjectCardData {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
}

const REGISTERED_PROJECTS: ProjectCardData[] = [
  {
    id: 'prj_default',
    name: 'Default Web Project (Demo)',
    writeKey: 'pk_live_demo12345',
    allowedOrigins: ['https://traffic-analytics-taupe.vercel.app', 'http://localhost:3000'],
    isActive: true,
  },
  {
    id: 'prj_portfolio',
    name: 'Personal Portfolio',
    writeKey: 'pk_live_portfo123',
    allowedOrigins: ['https://portofolio-saya.vercel.app', 'http://localhost:3000'],
    isActive: true,
  },
];

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectCardData>(REGISTERED_PROJECTS[0]);
  const [copied, setCopied] = useState(false);

  const trackerScriptSnippet = `<script
  defer
  data-project-id="${selectedProject.id}"
  data-write-key="${selectedProject.writeKey}"
  src="https://traffic-analytics-taupe.vercel.app/tracker.js">
</script>`;

  const copyToClipboard = () => {
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
          Dapatkan tag script 1-baris universal untuk dipasang di website mana pun (Next.js, React, HTML, WordPress, dll).
        </p>
      </div>

      {/* Embed Script Snippet Generator (Seperti Google Analytics / Umami) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span> Universal Tracking Script Tag
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy dan paste kode script ini tepat sebelum tag penutup <code className="text-sky-400">&lt;/head&gt;</code> atau <code className="text-sky-400">&lt;/body&gt;</code> di website Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Pilih Project:</label>
            <select
              value={selectedProject.id}
              onChange={(e) => {
                const found = REGISTERED_PROJECTS.find((p) => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {REGISTERED_PROJECTS.map((proj) => (
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

          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
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

      {/* Grid Project Aktif */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📁</span> Daftar Project Terdaftar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REGISTERED_PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-lg space-y-4 transition-all ${
                selectedProject.id === proj.id ? 'border-sky-500 ring-1 ring-sky-500/30' : 'border-slate-800'
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
      </div>
    </div>
  );
}
