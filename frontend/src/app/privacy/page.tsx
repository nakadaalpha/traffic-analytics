import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Kebijakan Privasi (Privacy Policy) | Firenalytics',
  description: 'Kebijakan privasi dan perlindungan data pengguna di platform Firenalytics.',
};

export default function PrivacyPage() {
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
            <Lock className="w-3.5 h-3.5" /> Perlindungan Privasi & Data
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mb-8">Terakhir diperbarui: 28 Oktober 2026</p>

          <div className="space-y-6 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-6">
            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">1. Informasi yang Kami Kumpulkan</h2>
              <p>
                Firenalytics mengumpulkan informasi anonim atau data akun yang Anda berikan secara sukarela, termasuk:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Alamat email untuk autentikasi pengguna.</li>
                <li>Data statistik publik dari platform yang terhubung (YouTube, Instagram, TikTok) seperti jumlah penayangan, suka, dan komentar.</li>
                <li>Metrik analitik lalu lintas klik website (CTA events) tanpa mengumpulkan data pribadi sensitif (PII).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">2. Penggunaan Data TikTok & API Sosial</h2>
              <p>
                Ketika Anda menghubungkan akun TikTok Anda dengan Firenalytics:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Kami hanya mengakses metrik performa profil dan video yang telah Anda setujui melalui Login Kit TikTok.</li>
                <li>Data tidak pernah dijual atau dibagikan kepada pihak ketiga untuk tujuan periklanan.</li>
                <li>Token otorisasi disimpan secara aman dengan enkripsi standar industri.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">3. Penghapusan dan Retensi Data</h2>
              <p>
                Anda dapat memutuskan hubungan akun TikTok, YouTube, atau Instagram Anda kapan saja melalui dasbor. Saat koneksi diputuskan, token akses akan segera dicabut dan dihapus dari sistem kami.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">4. Hak Pengguna</h2>
              <p>
                Sesuai dengan regulasi perlindungan data yang berlaku, Anda berhak meminta salinan data akun Anda atau meminta penghapusan permanen dengan menghubungi tim dukungan kami.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">5. Kontak Privasi</h2>
              <p>
                Untuk pertanyaan atau permintaan terkait data privasi Anda, silakan hubungi kami di privacy@firenalytics.com.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

