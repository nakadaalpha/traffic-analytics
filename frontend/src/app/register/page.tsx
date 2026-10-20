'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Meteran visual kekuatan kata sandi
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Sedang', color: 'bg-amber-500' };
    return { score: 3, label: 'Kuat', color: 'bg-emerald-500' };
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Kata sandi harus minimal 8 karakter');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/login?registered=1');
      } else {
        setError(data.error || 'Gagal melakukan pendaftaran');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xl font-bold">
              ⚡
            </span>
            <span className="text-2xl font-black text-white tracking-tight">
              ClickTracker <span className="text-sky-400 font-semibold text-xs px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800">PRO</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Buat Akun Pengelola</h1>
          <p className="text-xs text-slate-400">
            Daftarkan akun untuk mengelola proyek website dan mengamankan dasbor analitik
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Alpha"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alpha@domain.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username (Alfanumerik)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="alpha_dev"
                required
                minLength={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Kata Sandi (Min. 8 Karakter)</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-medium"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Kekuatan:</span>
                    <span className="font-semibold text-slate-300">{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className={`h-full rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'opacity-0'}`} />
                    <div className={`h-full rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'opacity-0'}`} />
                    <div className={`h-full rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'opacity-0'}`} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mendaftarkan akun...</span>
                </>
              ) : (
                <span>Daftar Akun Sekarang &rarr;</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800/80 text-xs text-slate-400">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold underline">
              Masuk di sini
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-400">
            &larr; Kembali ke Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
