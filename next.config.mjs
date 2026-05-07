/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: '/api/agent/:path*',
        destination: 'http://localhost:4001/:path*',
      },
    ]
  },
}

// module.exports = {
//   allowedDevOrigins: ['192.168.4.213'],
// }

export default nextConfig
