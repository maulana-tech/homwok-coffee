/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@homwok/ui', '@homwok/lib', '@homwok/types'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
}

module.exports = nextConfig
