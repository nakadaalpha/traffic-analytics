import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Ketentuan Layanan (Terms of Service) | Firenalytics',
  description: 'Syarat dan ketentuan penggunaan platform Firenalytics.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <nav className="w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-zinc-900 font-bold">
            <span className="p-1 rounded-md bg-zinc-900 text-white">
              <Zap className="w-4 h-4" />
            </span>
            <span>Firenalytics</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" /> Dokumen Hukum & Kepatuhan
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-zinc-500 mb-8">Terakhir diperbarui: 28 Oktober 2026</p>

          <div className="space-y-6 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-6">
            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">1. Pendahuluan</h2>
              <p>
                Selamat datang di Firenalytics. Dengan mengakses platform kami, Anda setuju untuk terikat oleh Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">2. Deskripsi Layanan</h2>
              <p>
                Firenalytics menyediakan alat analitik performa lalu lintas web dan mesin integrasi analitik media sosial (termasuk YouTube, Instagram, dan TikTok) untuk memantau metrik agregat seperti penayangan video, jumlah interaksi, suka, dan komentar.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">3. Integrasi Akun Pihak Ketiga</h2>
              <p>
                Saat Anda mengotorisasi akun media sosial pihak ketiga (seperti TikTok for Developers atau Meta Graph API) melalui Firenalytics, kami hanya meminta izin akses minimal untuk menarik statistik performa akun dan konten Anda. Kami tidak akan pernah mengubah kata sandi Anda atau memposting konten tanpa persetujuan eksplisit Anda.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">4. Hak Kekayaan Intelektual</h2>
              <p>
                Seluruh konten, merek dagang, dan kode sumber platform Firenalytics dilindungi oleh undang-undang kekayaan intelektual yang berlaku. Pengguna tetap memiliki hak penuh atas data konten mereka sendiri.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">5. Kontak & Bantuan</h2>
              <p>
                Jika Anda memiliki pertanyaan seputar ketentuan ini atau memerlukan bantuan teknis, silakan hubungi tim kami melalui email resmi di{' '}
                <a href="mailto:nakadaalpha@gmail.com" className="text-zinc-900 font-semibold underline underline-offset-2 hover:text-indigo-600 transition-colors">
                  nakadaalpha@gmail.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

