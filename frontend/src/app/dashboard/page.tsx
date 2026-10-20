import React from 'react';
import MetricsLiveTable from '@/components/analytics/MetricsLiveTable';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📈</span> Ringkasan Metrik CTA Real-Time
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau performa konversi klik dan CTA di seluruh halaman web secara otomatis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <span>&larr; Lihat Landing Page</span>
          </Link>
          <button
            type="button"
            data-track-cta="dashboard-hero-action-btn"
            className="px-4 py-2 text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg shadow-md shadow-sky-950 transition-all cursor-pointer active:scale-95"
          >
            + Test Dashboard CTA
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Metode Pengiriman</div>
          <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <span>Beacon API</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Fallback otomatis ke Keepalive Fetch</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Respons Backend</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            204 No Content
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Non-blocking / 0ms client wait time</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Model Agregasi</div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            Atomic UPSERT
          </div>
          <div className="text-[11px] text-slate-500 mt-2">PostgreSQL ON CONFLICT UPDATE</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium">Privasi Pengunjung</div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            IP Masking
          </div>
          <div className="text-[11px] text-slate-500 mt-2">GDPR &amp; UU PDP Compliant</div>
        </div>
      </div>

      {/* Live Table Section */}
      <MetricsLiveTable />
    </div>
  );
}
