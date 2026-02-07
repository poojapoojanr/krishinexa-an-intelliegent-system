import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // ✅ REQUIRED FOR LEAFLET

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sat.owm.io',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
