import type { Metadata } from 'next';
import './globals.css';
import ClickTracker from '@/components/analytics/ClickTracker';

export const metadata: Metadata = {
  title: 'Custom Click & CTA Tracking Tool',
  description: 'High-performance end-to-end Click & CTA Tracking with Next.js 16 and PostgreSQL',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        {/* Global Client Tracker Listener aktif di seluruh halaman (Landing maupun Dashboard) */}
        <ClickTracker />
        {children}
      </body>
    </html>
  );
}
