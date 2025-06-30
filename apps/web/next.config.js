/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sonder/ui', '@sonder/utils', '@sonder/types'],
  images: {
    domains: [
      'i.scdn.co',
      'mosaic.scdn.co',
      'wrapped-images.spotifycdn.com',
      'thisis-images.scdn.co',
      'seed-mix-image.spotifycdn.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001',
  }
};

module.exports = nextConfig;