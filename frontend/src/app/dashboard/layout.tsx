'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Memverifikasi sesi keamanan...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigasi Dashboard */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopHeader />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
          ClickTracker Pro &bull; Cloudflare Workers (Hono &amp; D1) &bull; Multi-Tenant &amp; JWT Auth
        </footer>
      </div>
    </div>
  );
}
