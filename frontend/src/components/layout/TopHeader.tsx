'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Activity, User as UserIcon } from 'lucide-react';

export function TopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Real-time Beacon Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-semibold flex items-center justify-center text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-semibold text-zinc-900 leading-tight">{user.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">@{user.username}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-700 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              title="Keluar dari sesi"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500 hover:text-rose-600" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-300 transition-all"
            >
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopHeader;
