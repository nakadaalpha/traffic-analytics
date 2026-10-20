import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'https://traffic-analytics-api.fireup-dist.workers.dev';
    return [
      {
        source: '/api/track/:path*',
        destination: `${backendUrl}/api/track/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
