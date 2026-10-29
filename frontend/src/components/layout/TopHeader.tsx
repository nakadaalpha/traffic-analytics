'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import {
  LogOut,
  Activity,
  User as UserIcon,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Shield,
  Layers
} from 'lucide-react';

export function TopHeader() {
  const { user, logout } = useAuth();
  const { currentProject, projects, selectProject, userRole } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleBadgeStyle = {
    owner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    editor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    viewer: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }[userRole] || 'bg-zinc-100 text-zinc-600 border-zinc-200';

  const roleLabel = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
  }[userRole] || 'Viewer';

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        {/* Workspace / Project Switcher Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-900 transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-5 h-5 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="max-w-[140px] sm:max-w-[180px] truncate">
                {currentProject?.name || 'Pilih Workspace'}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-0.5" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-zinc-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-zinc-100 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Daftar Workspace / Brand
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {projects.map((p) => {
                    const isSelected = p.id === currentProject?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          selectProject(p.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-zinc-50/80 font-bold text-zinc-900' : 'text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-zinc-100 p-1.5">
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Kelola / Buat Workspace</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Pelacakan Real-Time</span>
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
