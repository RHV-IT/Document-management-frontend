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
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Machine-Id, X-Machine-Name, X-Hostname, X-Platform, X-Browser, X-Browser-Version, X-Source' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Machine-Id, X-Machine-Name, X-Hostname, X-Platform, X-Browser, X-Browser-Version, X-Source' },
        ],
      },
    ]
  },
}

export default {
  ...nextConfig,
  allowedDevOrigins: ['192.168.8.216'],
}
