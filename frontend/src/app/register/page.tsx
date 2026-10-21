'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle2, Check } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Evaluasi kriteria spesifik kata sandi
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  // Syarat mutlak: seluruh kriteria wajib terpenuhi
  const isPasswordStrong = useMemo(() => {
    return (
      passwordCriteria.minLength &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial
    );
  }, [passwordCriteria]);

  // Validasi kecocokan konfirmasi sandi
  const isConfirmMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return confirmPassword === password;
  }, [password, confirmPassword]);

  // Meteran visual kekuatan kata sandi
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let count = 0;
    if (passwordCriteria.minLength) count += 1;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) count += 1;
    if (passwordCriteria.hasNumber) count += 1;
    if (passwordCriteria.hasSpecial) count += 1;

    if (count <= 2) return { score: 1, label: 'Kurang Kuat', color: 'bg-rose-500' };
    if (count === 3) return { score: 2, label: 'Cukup', color: 'bg-amber-500' };
    return { score: 3, label: 'Sangat Kuat', color: 'bg-emerald-600' };
  }, [password, passwordCriteria]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordStrong) {
      setError('Kata sandi harus minimal 8 karakter dan memuat huruf besar, huruf kecil, angka, serta simbol');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="p-2 rounded-lg bg-zinc-900 text-white">
              <Zap className="w-5 h-5" />
            </span>
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              Firenalytics
            </span>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Buat Akun Pengelola</h1>
          <p className="text-xs text-zinc-500">
            Daftarkan akun untuk mengelola proyek website dan dasbor analitik
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-zinc-200 rounded-xl p-7 shadow-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                required
                className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Username (Alfanumerik)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourname"
                required
                minLength={3}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">Kata Sandi</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5 h-1">
                    <div className={`flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-zinc-200'}`} />
                    <div className={`flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-zinc-200'}`} />
                    <div className={`flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-zinc-200'}`} />
                  </div>
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>Kekuatan kata sandi</span>
                    <span className="font-semibold text-zinc-700">{passwordStrength.label}</span>
                  </div>

                  {/* Checklist syarat kata sandi */}
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5 text-[11px] mt-1.5">
                    <div className="font-semibold text-zinc-700 text-[10px] uppercase tracking-wider">
                      Syarat Keamanan Kata Sandi:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-zinc-600">
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                        <Check className={`w-3 h-3 ${passwordCriteria.minLength ? 'text-emerald-600' : 'text-zinc-300'}`} />
                        <span>Min. 8 Karakter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper && passwordCriteria.hasLower ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                        <Check className={`w-3 h-3 ${passwordCriteria.hasUpper && passwordCriteria.hasLower ? 'text-emerald-600' : 'text-zinc-300'}`} />
                        <span>Huruf Besar &amp; Kecil</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                        <Check className={`w-3 h-3 ${passwordCriteria.hasNumber ? 'text-emerald-600' : 'text-zinc-300'}`} />
                        <span>Angka (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                        <Check className={`w-3 h-3 ${passwordCriteria.hasSpecial ? 'text-emerald-600' : 'text-zinc-300'}`} />
                        <span>Simbol (@, #, $, %, dll)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Konfirmasi Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">Konfirmasi Kata Sandi</label>
                {confirmPassword && (
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${isConfirmMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isConfirmMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Kata sandi cocok</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>Kata sandi belum cocok</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi..."
                  required
                  className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 transition-colors pr-10 ${
                    confirmPassword
                      ? isConfirmMatch
                        ? 'border-emerald-300 focus:border-emerald-600 focus:ring-emerald-600'
                        : 'border-rose-300 focus:border-rose-600 focus:ring-rose-600'
                      : 'border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-medium cursor-pointer"
                  title={showConfirmPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun Baru</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center border-t border-zinc-100 text-xs text-zinc-500">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-zinc-900 hover:underline font-semibold">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
