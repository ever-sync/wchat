/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.octadesk.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/blog-2', destination: '/blog', permanent: true },
      { source: '/cases-2', destination: '/cases', permanent: true },
      { source: '/works', destination: '/about', permanent: true },
    ];
  },
}

module.exports = nextConfig
