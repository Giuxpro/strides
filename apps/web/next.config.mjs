/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@strides/ui', '@strides/core', '@strides/db'],
  experimental: {
    serverComponentsExternalPackages: [
      '@anthropic-ai/sdk',
      '@google/generative-ai',
      'openai',
    ],
  },
}

export default nextConfig
