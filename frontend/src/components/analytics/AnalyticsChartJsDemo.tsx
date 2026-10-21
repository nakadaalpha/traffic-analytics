'use client';

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  Smartphone,
  BarChart2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  MousePointerClick,
  MapPin,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface MetricRow {
  project_id: string;
  element_id: string;
  page_path: string;
  total_clicks: string | number;
  last_clicked_at: string;
}

export interface ClickEventRow {
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

interface AnalyticsChartJsDemoProps {
  projectId?: string;
  projectName?: string;
  metrics?: MetricRow[];
  events?: ClickEventRow[];
  loading?: boolean;
}

// Helper deteksi warna brand resmi untuk CTA sosial media & platform
function getCtaBrandColor(elementId: string): { bg: string; hover: string; label: string } {
  const lower = elementId.toLowerCase();
  if (lower.includes('whatsapp') || lower.includes('wa')) {
    return { bg: '#25D366', hover: '#1ebe5d', label: 'WhatsApp' };
  }
  if (lower.includes('gmail') || lower.includes('email') || lower.includes('mailto')) {
    return { bg: '#EA4335', hover: '#c5221f', label: 'Gmail' };
  }
  if (lower.includes('instagram') || lower.includes('ig')) {
    return { bg: '#E1306C', hover: '#c1275b', label: 'Instagram' };
  }
  if (lower.includes('linkedin')) {
    return { bg: '#0077B5', hover: '#005f93', label: 'LinkedIn' };
  }
  if (lower.includes('github') || lower.includes('git')) {
    return { bg: '#24292E', hover: '#1b1f23', label: 'GitHub' };
  }
  if (lower.includes('youtube') || lower.includes('yt')) {
    return { bg: '#EF4444', hover: '#dc2626', label: 'YouTube' };
  }
  if (lower.includes('twitter') || lower.includes('x.com')) {
    return { bg: '#0F1419', hover: '#000000', label: 'X / Twitter' };
  }
  if (lower.includes('telegram') || lower.includes('t.me')) {
    return { bg: '#229ED9', hover: '#1d8bc0', label: 'Telegram' };
  }
  if (lower.includes('facebook') || lower.includes('fb')) {
    return { bg: '#1877F2', hover: '#1464cc', label: 'Facebook' };
  }
  if (lower.includes('tiktok')) {
    return { bg: '#000000', hover: '#18181b', label: 'TikTok' };
  }
  return { bg: '#18181b', hover: '#27272a', label: '' };
}

export default function AnalyticsChartJsDemo({
  projectId = '',
  projectName = '',
  metrics = [],
  events = [],
  loading = false,
}: AnalyticsChartJsDemoProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // 1. Total Klik Nyata
  const totalClicks = useMemo(() => {
    return metrics.reduce((sum, item) => sum + (Number(item.total_clicks) || 0), 0);
  }, [metrics]);

  // 2. Data Peringkat CTA Teratas (Horizontal Bar Chart) 100% Nyata dari D1
  const sortedCtaList = useMemo(() => {
    return [...metrics]
      .map((m) => ({
        element_id: m.element_id,
        clicks: Number(m.total_clicks) || 0,
        page_path: m.page_path,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }, [metrics]);

  const barData = useMemo(() => {
    if (sortedCtaList.length === 0) {
      return {
        labels: ['Belum ada data'],
        datasets: [
          {
            label: 'Jumlah Klik',
            data: [0],
            backgroundColor: ['#e4e4e7'],
            borderRadius: 4,
            barPercentage: 0.5,
          },
        ],
      };
    }

    const backgroundColors = sortedCtaList.map((item, idx) => {
      const brand = getCtaBrandColor(item.element_id);
      if (brand.label) return brand.bg;
      const zincs = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
      return zincs[idx % zincs.length];
    });

    const hoverColors = sortedCtaList.map((item) => {
      const brand = getCtaBrandColor(item.element_id);
      if (brand.label) return brand.hover;
      return '#09090b';
    });

    return {
      labels: sortedCtaList.map((item) => item.element_id),
      datasets: [
        {
          label: 'Jumlah Klik',
          data: sortedCtaList.map((item) => item.clicks),
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverColors,
          borderRadius: 4,
          barPercentage: sortedCtaList.length === 1 ? 0.35 : 0.6,
        },
      ],
    };
  }, [sortedCtaList]);

  const maxClickVal = sortedCtaList[0]?.clicks || 5;
  const barOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const rawId = sortedCtaList[context.dataIndex]?.element_id || '';
            const brand = getCtaBrandColor(rawId);
            const tag = brand.label ? ` (${brand.label})` : '';
            return ` ${context.parsed.x} total klik tercatat${tag}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: Math.max(10, Math.ceil(maxClickVal * 1.3)),
        grid: { color: '#f4f4f5' },
        ticks: { color: '#71717a', font: { size: 10 }, stepSize: Math.max(1, Math.ceil(maxClickVal / 5)) },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#18181b', font: { size: 11, weight: '500' } },
      },
    },
  };

  // 3. Data Distribusi Perangkat (Doughnut Chart) Nyata dari user_agent
  const deviceStats = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;

    events.forEach((ev) => {
      const ua = (ev.user_agent || '').toLowerCase();
      if (ua.includes('ipad') || ua.includes('tablet')) {
        tablet++;
      } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        mobile++;
      } else {
        desktop++;
      }
    });

    const total = events.length;
    if (total === 0) {
      return { mobile: 0, desktop: 0, tablet: 0, mobilePct: 0, desktopPct: 0, tabletPct: 0, total: 0, dominant: 'None' };
    }

    const mobilePct = Math.round((mobile / total) * 100);
    const desktopPct = Math.round((desktop / total) * 100);
    const tabletPct = Math.max(0, 100 - mobilePct - desktopPct);

    let dominant = 'Desktop';
    let dominantPct = desktopPct;
    if (mobilePct > desktopPct && mobilePct >= tabletPct) {
      dominant = 'Mobile';
      dominantPct = mobilePct;
    } else if (tabletPct > desktopPct && tabletPct > mobilePct) {
      dominant = 'Tablet';
      dominantPct = tabletPct;
    }

    return { mobile, desktop, tablet, mobilePct, desktopPct, tabletPct, total, dominant, dominantPct };
  }, [events]);

  const doughnutData = useMemo(() => {
    if (deviceStats.total === 0) {
      return {
        labels: ['Belum Ada Pengunjung'],
        datasets: [
          {
            data: [100],
            backgroundColor: ['#e4e4e7'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      };
    }

    return {
      labels: ['Mobile Phone', 'Desktop PC', 'Tablet'],
      datasets: [
        {
          data: [deviceStats.mobilePct, deviceStats.desktopPct, deviceStats.tabletPct],
          backgroundColor: [
            '#16a34a', // emerald-600 (mobile)
            '#2563eb', // blue-600 (desktop)
            '#9333ea', // purple-600 (tablet)
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [deviceStats]);

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.parsed}%`,
        },
      },
    },
  };

  // 4. Data Tren Fluktuasi Waktu (Line Chart) Nyata dari created_at
  const lineChartData = useMemo(() => {
    if (timeRange === '24h') {
      const labels = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
      const counts = [0, 0, 0, 0, 0, 0, 0, 0];

      events.forEach((ev) => {
        try {
          const d = new Date(ev.created_at);
          const hr = d.getHours();
          const bucketIndex = Math.floor(hr / 3);
          if (bucketIndex >= 0 && bucketIndex < 8) {
            counts[bucketIndex]++;
          }
        } catch {
          // ignore date parse errors
        }
      });

      return {
        labels,
        datasets: [
          {
            label: 'Total Klik CTA',
            data: counts,
            borderColor: '#18181b',
            backgroundColor: 'rgba(24, 24, 27, 0.04)',
            fill: true,
            tension: 0.25,
            borderWidth: 2,
            pointBackgroundColor: '#18181b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 5,
          },
        ],
      };
    }

    if (timeRange === '7d') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const counts = [0, 0, 0, 0, 0, 0, 0];

      events.forEach((ev) => {
        try {
          const d = new Date(ev.created_at);
          const dayIndex = d.getDay();
          counts[dayIndex]++;
        } catch {
          // ignore
        }
      });

      return {
        labels: days,
        datasets: [
          {
            label: 'Total Klik CTA',
            data: counts,
            borderColor: '#18181b',
            backgroundColor: 'rgba(24, 24, 27, 0.04)',
            fill: true,
            tension: 0.25,
            borderWidth: 2,
            pointBackgroundColor: '#18181b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 5,
          },
        ],
      };
    }

    // 30 hari
    const labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    const counts = [0, 0, 0, 0];
    const now = Date.now();

    events.forEach((ev) => {
      try {
        const diffDays = Math.floor((now - new Date(ev.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) counts[3]++;
        else if (diffDays <= 14) counts[2]++;
        else if (diffDays <= 21) counts[1]++;
        else counts[0]++;
      } catch {
        counts[3]++;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Klik CTA',
          data: counts,
          borderColor: '#18181b',
          backgroundColor: 'rgba(24, 24, 27, 0.04)',
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointBackgroundColor: '#18181b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3.5,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [events, timeRange]);

  const maxTimelineCount = Math.max(...(lineChartData.datasets[0]?.data || [5]), 5);
  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} klik pada periode ini`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        max: Math.max(5, Math.ceil(maxTimelineCount * 1.3)),
        grid: { color: '#f4f4f5' },
        ticks: { color: '#71717a', font: { size: 11 }, stepSize: Math.max(1, Math.ceil(maxTimelineCount / 4)) },
      },
    },
  };

  // 5. Wawasan & Rekomendasi Tindakan Dinamis
  const dynamicInsights = useMemo(() => {
    const topCta = sortedCtaList[0];
    const topShare = totalClicks > 0 && topCta ? Math.round((topCta.clicks / totalClicks) * 100) : 0;
    const uniqueSessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size || 1;
    const sessionRatio = totalClicks > 0 ? (totalClicks / uniqueSessions).toFixed(2) : '0.00';

    let ctaTitle = 'Belum Ada Aktivitas CTA';
    let ctaDesc = 'Belum ada tombol CTA yang diklik pada proyek terpilih.';

    if (topCta && totalClicks > 0) {
      ctaTitle = `Tombol "${topCta.element_id}" Mendominasi Konversi (${topShare}%)`;
      if (sortedCtaList.length > 1) {
        ctaDesc = `Tombol ini telah menerima ${topCta.clicks} klik dari total ${totalClicks} klik pada proyek ini. Pengunjung lebih dominan menghubungi lewat ${topCta.element_id} dibandingkan ${sortedCtaList[1].element_id} (${sortedCtaList[1].clicks} klik).`;
      } else {
        ctaDesc = `Tombol ini menyumbang seluruh konversi klik (${topCta.clicks} klik) yang tercatat pada proyek saat ini.`;
      }
    }

    let devTitle = 'Belum Ada Data Perangkat';
    let devDesc = 'Menunggu klik dari pengunjung untuk memetakan jenis perangkat.';

    if (deviceStats.total > 0) {
      if (deviceStats.dominant === 'Desktop') {
        devTitle = `Mayoritas Pengguna Menggunakan Desktop (${deviceStats.desktopPct}%)`;
        devDesc = `Interaksi didominasi oleh pengguna komputer desktop/laptop (${deviceStats.desktop} dari ${deviceStats.total} klik). Pastikan tombol CTA terlihat kontras pada resolusi layar lebar.`;
      } else if (deviceStats.dominant === 'Mobile') {
        devTitle = `Mayoritas Pengguna Menggunakan Smartphone (${deviceStats.mobilePct}%)`;
        devDesc = `Interaksi didominasi oleh layar ponsel (${deviceStats.mobile} dari ${deviceStats.total} klik). Pastikan tombol CTA memiliki tinggi minimal 44px agar ramah sentuhan jempol.`;
      } else {
        devTitle = `Akses Terdistribusi Merata (${deviceStats.total} klik)`;
        devDesc = `Pengunjung berinteraksi melalui berbagai perangkat secara berimbang. Pertahankan responsivitas halaman.`;
      }
    }

    const isHealthy = Number(sessionRatio) <= 3.0;

    // Hitung konsentrasi geolokasi pengunjung
    const cityCounts: Record<string, number> = {};
    events.forEach((ev) => {
      const city = ev.city && ev.city !== 'Unknown' ? ev.city : null;
      if (city) {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });
    const topCities = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      ctaTitle,
      ctaDesc,
      devTitle,
      devDesc,
      uniqueSessions,
      sessionRatio,
      isHealthy,
      topCities,
    };
  }, [sortedCtaList, totalClicks, events, deviceStats]);

  return (
    <div className="space-y-6">
      {/* Header Bar Analitik dengan Filter Waktu */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-medium mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
            <span>Real-Time D1 Analytics &bull; Proyek: {projectName || projectId}</span>
          </div>
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            Visualisasi &amp; Wawasan Analitik CTA
          </h2>
          <p className="text-xs text-zinc-500">
            Data analitik teragregasi langsung dari {events.length} riwayat klik nyata dan {metrics.length} elemen aktif
          </p>
        </div>

        {/* Filter Rentang Waktu (24 Jam / 7 Hari / 30 Hari) */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              timeRange === '24h'
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            24 Jam
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              timeRange === '7d'
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              timeRange === '30d'
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Grid Grafik Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom Kiri: Tren Waktu (Line Chart) - Span 2 */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Tren Fluktuasi Klik CTA</h3>
                <p className="text-[11px] text-zinc-500">
                  Total {events.length} event klik nyata dipetakan pada periode {timeRange}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                {events.length} Klik Terpetakan
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>

        {/* Kolom Kanan: Distribusi Perangkat (Doughnut Chart) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Perangkat Pengunjung</h3>
              <p className="text-[11px] text-zinc-500">Berdasarkan User-Agent Nyata</p>
            </div>
          </div>

          {/* Donut Chart Canvas with Center Stat */}
          <div className="h-44 relative flex items-center justify-center my-1">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-zinc-900">
                {deviceStats.total > 0 ? `${deviceStats.dominantPct}%` : '0%'}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {deviceStats.total > 0 ? deviceStats.dominant : 'No Data'}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">{deviceStats.mobilePct}%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Mobile ({deviceStats.mobile})</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">{deviceStats.desktopPct}%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Desktop ({deviceStats.desktop})</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">{deviceStats.tabletPct}%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Tablet ({deviceStats.tablet})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Bawah: Performa CTA Teratas & Kotak Wawasan Otomatis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Performa CTA (Horizontal Bar) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Peringkat CTA Teratas</h3>
                <p className="text-[11px] text-zinc-500">
                  {sortedCtaList.length} tombol terdaftar pada proyek ini
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Total {totalClicks} Klik
            </span>
          </div>

          <div className="h-48 w-full pt-2">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Wawasan Analisa Otomatis (Smart Insights) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Wawasan &amp; Rekomendasi Tindakan</h3>
              <p className="text-[11px] text-zinc-500">Temuan otomatis dari data klik terkumpul</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900 block font-semibold">
                  {dynamicInsights.ctaTitle}
                </strong>
                <span className="text-zinc-600">{dynamicInsights.ctaDesc}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900 block font-semibold">
                  {dynamicInsights.devTitle}
                </strong>
                <span className="text-zinc-600">{dynamicInsights.devDesc}</span>
              </div>
            </div>

            {dynamicInsights.topCities && dynamicInsights.topCities.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-900 block font-semibold">
                    Konsentrasi Wilayah Pengunjung
                  </strong>
                  <span className="text-zinc-600">
                    Interaksi klik terdeteksi berasal dari {dynamicInsights.topCities.map((c: any) => `${c.name} (${c.count} klik)`).join(', ')}.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              Rasio Sesi Unik: <strong>{dynamicInsights.sessionRatio} klik / sesi</strong> ({dynamicInsights.uniqueSessions} sesi pengunjung)
            </span>
            <span
              className={`font-medium ${
                dynamicInsights.isHealthy ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {dynamicInsights.isHealthy ? 'Organik Sehat' : 'Intensitas Tinggi'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
