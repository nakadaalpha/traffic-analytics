'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import { Loader2 } from 'lucide-react';

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
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Memverifikasi sesi keamanan...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        {/* Sidebar Navigasi Dashboard */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <TopHeader />

          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <footer className="border-t border-zinc-200 bg-white py-4 px-6 text-center text-xs text-zinc-500">
            Firenalytics &bull; Platform Analitik Lalu Lintas &amp; Media Sosial Terpadu
          </footer>
        </div>
      </div>
    </ProjectProvider>
  );
}
