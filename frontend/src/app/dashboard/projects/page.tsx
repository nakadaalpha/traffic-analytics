import React from 'react';

export default function ProjectsPage() {
  const projects = [
    {
      id: 'prj_default',
      name: 'Default Web Project (Lokal)',
      writeKey: 'pk_live_demo12345',
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      status: 'Active',
      created: '2026-10-20',
    },
    {
      id: 'prj_shop_klien',
      name: 'E-Commerce Klien Demo',
      writeKey: 'pk_live_shop98765',
      allowedOrigins: ['https://tokoklien.com', 'http://localhost:3000'],
      status: 'Active',
      created: '2026-10-20',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>💼</span> Manajemen Project &amp; Keamanan Klien
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Daftar project klien terdaftar beserta Write-Key dan Domain Whitelisting masing-masing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">{proj.name}</h3>
                <span className="font-mono text-xs text-sky-400">{proj.id}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {proj.status}
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

            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500">
                Data klik untuk project ini terisolasi otomatis di database PostgreSQL.
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Snippet Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🚀</span> Cara Menghubungkan Project Klien Baru
        </h3>
        <p className="text-xs text-slate-400">
          Cukup pasang snippet variabel environment berikut pada project Next.js atau React klien Anda:
        </p>
        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto">
{`NEXT_PUBLIC_TRACKING_PROJECT_ID=prj_shop_klien
NEXT_PUBLIC_TRACKING_WRITE_KEY=pk_live_shop98765
NEXT_PUBLIC_TRACKING_API_URL=http://localhost:5000/api/track/click`}
        </pre>
      </div>
    </div>
  );
}
