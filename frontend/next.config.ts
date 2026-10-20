import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/track/:path*',
        destination: `${backendUrl}/api/track/:path*`,
      },
    ];
  },
};

export default nextConfig;
