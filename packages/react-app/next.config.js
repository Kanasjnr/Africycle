/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Static export removed for Vercel deployment
  // output: 'export',
  trailingSlash: true,
  
  // Image optimization enabled for Vercel
  images: {
    // unoptimized: true,
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dn2ed9k6p/image/upload/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  
  // Webpack configuration for better path resolution
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@local-contracts': path.resolve(__dirname, '../hardhat'),
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  optimizeFonts: true,
  experimental: {
    forceSwcTransforms: false,
  },
  transpilePackages: [],
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
  
  swcMinify: false,
};

module.exports = nextConfig;
