'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-sky-400 hover:underline flex items-center gap-1">
            <span>&larr; Kembali ke Landing Page</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
            <span>Buka Dashboard &rarr;</span>
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-slate-100">
          <h1 className="text-2xl font-bold mb-2 text-white">Pengaturan Profil Pengguna (CTA Demo)</h1>
          <p className="text-slate-400 text-sm mb-6">
            Halaman demonstrasi form. Setiap klik tombol simpan username dilacak otomatis oleh CTA Tracker dengan atribut <code className="text-emerald-400 font-mono text-xs">data-track-cta=&quot;profile-save-username&quot;</code>.
          </p>

          {statusMessage && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-sm font-medium">
              ✓ {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username Baru
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                placeholder="Masukkan username baru..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUsername('john_doe')}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm"
              >
                Reset
              </button>

              {/* Tombol Simpan Username dengan atribut data-track-cta="profile-save-username" */}
              <button
                type="submit"
                data-track-cta="profile-save-username"
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-950 cursor-pointer"
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
