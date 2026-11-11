'use client';

import React from 'react';
import { ShieldAlert, Clock, LogOut, ShieldCheck } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalWarningSeconds?: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
  isExtending?: boolean;
}

export default function SessionTimeoutModal({
  isOpen,
  remainingSeconds,
  totalWarningSeconds = 60,
  onStayLoggedIn,
  onLogoutNow,
  isExtending = false,
}: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  const pct = Math.max(0, Math.min(100, (remainingSeconds / totalWarningSeconds) * 100));
  const isUrgent = remainingSeconds <= 15;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              isUrgent
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 id="session-timeout-title" className="text-base font-bold text-zinc-900 tracking-tight">
              Sesi Anda Akan Berakhir
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tidak ada aktivitas terdeteksi selama beberapa waktu. Demi keamanan data prospek dan akun Anda, sistem akan keluar secara otomatis.
            </p>
          </div>
        </div>

        {/* Countdown Timer Display */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600 animate-spin' : 'text-zinc-400'}`} />
              Sisa Waktu Sesi:
            </span>
            <span
              className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-md ${
                isUrgent
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {remainingSeconds} detik
            </span>
          </div>

          {/* Shrinking Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isUrgent ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onLogoutNow}
            disabled={isExtending}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sekarang</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            disabled={isExtending}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isExtending ? 'Memperpanjang...' : 'Tetap Masuk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

