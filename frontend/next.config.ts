import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const defaultBackendUrl = isDev
      ? 'http://localhost:5000'
      : 'https://traffic-analytics-api.fireup-dist.workers.dev';
    const backendUrl = process.env.BACKEND_INTERNAL_URL || defaultBackendUrl;
    return [
      {
        source: '/api/track/:path*',
        destination: `${backendUrl}/api/track/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/api/composio/:path*',
        destination: `${backendUrl}/api/composio/:path*`,
      },
    ];
  },
};

export default nextConfig;
