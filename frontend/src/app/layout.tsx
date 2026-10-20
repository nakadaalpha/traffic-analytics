import type { Metadata } from 'next';
import './globals.css';
import ClickTracker from '@/components/analytics/ClickTracker';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Custom Click & CTA Tracking Tool',
  description: 'High-performance end-to-end Click & CTA Tracking with Cloudflare Workers (Hono & D1) and Next.js 16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <AuthProvider>
          {/* Global Client Tracker Listener aktif di seluruh halaman */}
          <ClickTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
