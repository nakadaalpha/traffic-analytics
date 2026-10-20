'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, User } from 'lucide-react';

export default function ProfilePage() {
  const [username, setUsername] = useState('john_doe');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Perubahan username berhasil disimpan!');
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs">
          <Link href="/" className="text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
          <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 transition-colors">
            <span>Buka Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-sm text-zinc-900 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-800">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900">Demo Profil &amp; CTA Form</h1>
              <p className="text-xs text-zinc-500">
                Uji coba event pelacakan tombol simpan form
              </p>
            </div>
          </div>

          <p className="text-zinc-600 text-xs leading-relaxed">
            Halaman demonstrasi form. Setiap klik tombol di bawah dilacak otomatis oleh ClickTracker menggunakan atribut <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-800 font-mono text-xs">data-track-cta=&quot;profile-save-username&quot;</code>.
          </p>

          {statusMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Username Baru
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 text-xs focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 font-mono transition-colors"
                placeholder="Masukkan username baru..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setUsername('john_doe')}
                className="px-3.5 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 text-xs font-medium transition-colors"
              >
                Reset
              </button>

              {/* Tombol Simpan Username dengan atribut data-track-cta="profile-save-username" */}
              <button
                type="submit"
                data-track-cta="profile-save-username"
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
              >
                Simpan Username
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
