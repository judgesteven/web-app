/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.gamelayer.co',
      },
      {
        protocol: 'https',
        hostname: 'images.gamelayer.co',
      },
    ],
  },
}

module.exports = nextConfig 