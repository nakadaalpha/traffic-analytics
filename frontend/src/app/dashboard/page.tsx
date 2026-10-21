import React from 'react';
import MetricsLiveTable from '@/components/analytics/MetricsLiveTable';
import AnalyticsChartJsDemo from '@/components/analytics/AnalyticsChartJsDemo';
import Link from 'next/link';
import { BarChart3, ArrowLeft, Plus, CheckCircle2, ShieldCheck, Zap, Database } from 'lucide-react';

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-800" />
            <span>Ringkasan Metrik CTA Real-Time</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Pantau performa konversi klik dan CTA di seluruh halaman web secara otomatis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="px-3 py-2 text-xs bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg border border-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lihat Halaman Demo</span>
          </Link>
          <button
            type="button"
            data-track-cta="dashboard-hero-action-btn"
            className="px-3.5 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Uji Tombol Dashboard</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Metode Pengiriman</span>
            <Zap className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>Beacon API</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Active
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Fallback otomatis ke Keepalive Fetch</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Respons Backend</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            204 No Content
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Non-blocking / 0ms client wait time</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Model Agregasi</span>
            <Database className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            Atomic UPSERT
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">Cloudflare D1 ON CONFLICT UPDATE</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-zinc-500 text-xs font-medium flex items-center justify-between">
            <span>Privasi Pengunjung</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-lg font-bold text-zinc-900 mt-1">
            IP Masking
          </div>
          <div className="text-[11px] text-zinc-500 pt-1">GDPR &amp; Standar UU PDP</div>
        </div>
      </div>

      {/* Chart.js Analytics Visualization Section */}
      <AnalyticsChartJsDemo />

      {/* Live Table Section */}
      <MetricsLiveTable />
    </div>
  );
}
