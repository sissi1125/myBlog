/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',      // Docker 部署：生成最小化独立产物
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
