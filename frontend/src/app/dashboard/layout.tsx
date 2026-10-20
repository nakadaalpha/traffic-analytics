import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigasi Dashboard */}
      <Sidebar />

      {/* Main Content Area dengan offset 64 (16rem) untuk sidebar di desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopHeader />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
          ClickTracker Pro &bull; Next.js 16 App Router &bull; Express.js &amp; PostgreSQL Multi-Tenant
        </footer>
      </div>
    </div>
  );
}
