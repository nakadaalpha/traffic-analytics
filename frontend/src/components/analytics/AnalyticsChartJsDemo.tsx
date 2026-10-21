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
  Calendar,
  Sparkles,
  Users,
  MousePointerClick,
  Info,
} from 'lucide-react';

// Register Chart.js components
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

interface AnalyticsChartJsDemoProps {
  projectId?: string;
  totalClicks?: number;
}

export default function AnalyticsChartJsDemo({
  projectId,
  totalClicks = 42,
}: AnalyticsChartJsDemoProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // 1. Data Tren Aktivitas Klik Waktu (Line Chart)
  const lineChartData = useMemo(() => {
    if (timeRange === '24h') {
      const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      const data = [2, 1, 0, 8, 14, 11, 23, 17];
      return {
        labels,
        datasets: [
          {
            label: 'Total Klik CTA',
            data,
            borderColor: '#18181b', // solid zinc-900
            backgroundColor: 'rgba(24, 24, 27, 0.04)', // subtle flat tint
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
      const labels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const data = [12, 19, 15, 27, 34, 42, 38];
      return {
        labels,
        datasets: [
          {
            label: 'Total Klik CTA',
            data,
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
    const data = [112, 168, 194, 245];
    return {
      labels,
      datasets: [
        {
          label: 'Total Klik CTA',
          data,
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
  }, [timeRange]);

  // Konfigurasi Opsi Line Chart (Monokrom Flat)
  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { size: 11, weight: '600' },
        bodyFont: { size: 12, weight: 'bold' },
        callbacks: {
          label: (context: any) => `${context.parsed.y} klik konversi`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#71717a',
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f4f4f5',
          lineWidth: 1,
        },
        ticks: {
          color: '#71717a',
          font: { size: 11 },
          stepSize: 10,
        },
      },
    },
  };

  // 2. Data Distribusi Perangkat (Doughnut Chart)
  const doughnutData = {
    labels: ['Mobile Phone', 'Desktop PC', 'Tablet'],
    datasets: [
      {
        data: [68, 28, 4],
        backgroundColor: [
          '#18181b', // zinc-900 (mobile)
          '#71717a', // zinc-500 (desktop)
          '#d4d4d8', // zinc-300 (tablet)
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { size: 11, weight: '600' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.parsed}%`,
        },
      },
    },
  };

  // 3. Data Performa CTA Teratas (Horizontal Bar Chart)
  const barData = {
    labels: ['btn-whatsapp', 'btn-checkout', 'btn-download-pdf', 'btn-register'],
    datasets: [
      {
        label: 'Jumlah Klik',
        data: [48, 26, 14, 8],
        backgroundColor: ['#18181b', '#3f3f46', '#71717a', '#a1a1aa'],
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

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
          label: (context: any) => `${context.parsed.x} total klik`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f4f4f5' },
        ticks: { color: '#71717a', font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#18181b', font: { size: 11, weight: '500' } },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Bar Analitik dengan Filter Waktu */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-medium mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
            <span>Chart.js Engine &bull; Analytics Preview</span>
          </div>
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            Visualisasi &amp; Wawasan Analitik CTA
          </h2>
          <p className="text-xs text-zinc-500">
            Analisis fluktuasi klik waktu, efektivitas tombol, dan segmentasi perangkat pengunjung
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
                  Aktivitas konversi berdasarkan rentang waktu terpilih
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +24.8% vs periode lalu
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
              <p className="text-[11px] text-zinc-500">Proporsi Mobile vs Desktop</p>
            </div>
          </div>

          {/* Donut Chart Canvas with Center Stat */}
          <div className="h-44 relative flex items-center justify-center my-1">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-zinc-900">68%</span>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                Mobile
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">68%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-900" />
                <span>Mobile</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">28%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>Desktop</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900">4%</div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
                <span>Tablet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Bawah: Performa CTA Teratas & Kotak Wawasan Otomatis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Performa CTA (Horizontal Bar) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Peringkat CTA Teratas</h3>
              <p className="text-[11px] text-zinc-500">Komparasi efektivitas antar tombol</p>
            </div>
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
                <strong className="text-zinc-900 block font-semibold">Mayoritas Pengguna Menggunakan Smartphone (68%)</strong>
                <span className="text-zinc-600">
                  Pastikan tombol CTA memiliki tinggi minimal 44px agar nyaman disentuh dengan jempol satu tangan pada layar ponsel.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900 block font-semibold">Tombol WhatsApp Mendominasi Konversi (50%)</strong>
                <span className="text-zinc-600">
                  Pengunjung lebih menyukai kontak langsung dibanding mengisi formulir registrasi panjang.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Rasio Sesi Unik: <strong>1.12 klik / sesi</strong> (Organik sehat)</span>
            <span className="text-emerald-700 font-medium">Bebas Klik Spam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
