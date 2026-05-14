import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Fix: monorepo workspace root detection warning
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  transpilePackages: [],
};

export default nextConfig;
