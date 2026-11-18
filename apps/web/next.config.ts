import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Shared types/permissions from the monorepo.
  transpilePackages: ['@bossone/shared'],
  images: {
    // Product images are served through short-lived Supabase Storage signed URLs.
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '54321' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
