/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
  images: {
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com', 'www.uira.net'],
    // Optimize for TV screens
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Optimize for production
  reactStrictMode: true,
  swcMinify: true,

  // Optimize for TV browsers
  experimental: {
    // Optimize for large screens
    largePageDataBytes: 128 * 1000, // 128KB
    // Optimize for TV browsers that might have limited capabilities
    optimizeCss: false,
  },

  // Configure headers for better caching and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
