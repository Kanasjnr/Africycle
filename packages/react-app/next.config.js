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
  webpack: (config, { isServer, dev }) => {
    // Basic fallbacks
    config.resolve.fallback = {
      fs: false,
    };
    
    if (!isServer) {
      // Completely ignore HeartbeatWorker files
      config.resolve.alias = {
        ...config.resolve.alias,
        'HeartbeatWorker.js': false,
        'HeartbeatWorker': false,
      };
      
      // Add multiple rules to catch and ignore HeartbeatWorker
      config.module.rules.push(
        {
          test: /HeartbeatWorker\.(js|ts)$/,
          use: 'null-loader'
        },
        {
          test: /.*HeartbeatWorker.*\.(js|ts)$/,
          use: 'null-loader'
        }
      );
      
      // Disable minification for problematic files entirely
      config.optimization = {
        ...config.optimization,
        minimizer: config.optimization.minimizer?.filter(
          (plugin) => {
            // If it's processing files that include HeartbeatWorker, skip it
            return true;
          }
        ).map((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            return {
              ...plugin,
              options: {
                ...plugin.options,
                exclude: /HeartbeatWorker/,
              }
            };
          }
          return plugin;
        }),
      };
    }
    
    return config;
  },
  optimizeFonts: true,
  // Remove experimental features that might cause issues
  experimental: {},
  transpilePackages: [],
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;
