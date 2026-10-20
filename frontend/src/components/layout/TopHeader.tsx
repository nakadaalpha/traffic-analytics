'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function TopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Beacon Tracking Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-500/40 text-sky-400 font-bold flex items-center justify-center uppercase text-xs">
                {user.username.charAt(0)}
              </span>
              <div className="hidden md:block text-left">
                <div className="font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-800/80 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Keluar dari sesi"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
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
