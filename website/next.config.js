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
}

module.exports = nextConfig
