/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  
  // Static export to completely bypass Netlify's Next.js runtime
  output: 'export',
  skipTrailingSlashRedirect: true,
  
  images: {
    unoptimized: true,
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
    ignoreBuildErrors: false, 
  },
  
  trailingSlash: false,
  
  swcMinify: false,
};

module.exports = nextConfig;
