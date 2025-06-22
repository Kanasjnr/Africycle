/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
    };
    
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'HeartbeatWorker.js': false,
      };
      
      // Configure the module rules to handle workers properly
      config.module.rules.push({
        test: /HeartbeatWorker\.js$/,
        use: 'null-loader'
      });
      
      // Add worker-loader for proper worker files
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        use: {
          loader: 'worker-loader',
          options: {
            name: 'static/[hash].worker.js',
            publicPath: '/_next/',
          },
        },
      });
    }
    
    return config;
  },
  optimizeFonts: true,
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
