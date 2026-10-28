'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  Layers, 
  BookOpen, 
  Zap, 
  ChevronRight, 
  ArrowUpRight,
  Menu,
  X,
  Share2
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    {
      name: 'Ringkasan Metrik',
      href: '/dashboard',
      icon: BarChart3,
    },
    {
      name: 'Event Logs',
      href: '/dashboard/events',
      icon: FileText,
    },
    {
      name: 'Analitik Media Sosial',
      href: '/dashboard/social',
      icon: Share2,
    },
    {
      name: 'Manajemen Project',
      href: '/dashboard/projects',
      icon: Layers,
    },
    {
      name: 'Panduan Integrasi',
      href: '/dashboard/docs',
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-200">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 font-bold text-base text-zinc-900 tracking-tight"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span>
              Firenalytics
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-900 flex items-center gap-0.5 transition-colors"
            title="Keluar ke Landing Page"
          >
            <span>Landing</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
            Analytics Console
          </div>

          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </Link>
            );
          })}

          {/* Quick CTA Tester
          <div className="pt-6 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
            CTA Tester Cepat
          </div>

          <button
            type="button"
            data-track-cta="sidebar-quick-test-btn"
            className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>Test Click (Sidebar CTA)</span>
          </button> */}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
