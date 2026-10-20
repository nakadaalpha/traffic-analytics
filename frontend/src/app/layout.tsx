import type { Metadata } from 'next';
import './globals.css';
import ClickTracker from '@/components/analytics/ClickTracker';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'ClickTracker PRO | Enterprise CTA & Traffic Analytics',
  description: 'Clean, light-mode, high-performance click and conversion tracking powered by Cloudflare Workers and Next.js 16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
        <AuthProvider>
          <ClickTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
