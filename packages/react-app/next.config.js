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
    config.resolve.fallback = {
      fs: false,
    };
    
    if (!isServer) {
      // More aggressive exclusion of HeartbeatWorker
      config.resolve.alias = {
        ...config.resolve.alias,
        'HeartbeatWorker.js': false,
        'HeartbeatWorker': false,
      };
      
      // Configure module rules to completely ignore HeartbeatWorker files
      config.module.rules.push({
        test: /HeartbeatWorker\.(js|ts)$/,
        use: 'null-loader'
      });
      
      // Exclude HeartbeatWorker from being processed by any loaders
      config.module.rules.push({
        test: /.*HeartbeatWorker.*\.(js|ts)$/,
        use: 'null-loader'
      });
      
      // Add worker-loader for proper worker files (but not HeartbeatWorker)
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        exclude: /HeartbeatWorker/,
        use: {
          loader: 'worker-loader',
          options: {
            name: 'static/[hash].worker.js',
            publicPath: '/_next/',
          },
        },
      });
      
      // Exclude HeartbeatWorker from being processed by Terser
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin' || minimizer.options) {
            if (!minimizer.options) minimizer.options = {};
            if (!minimizer.options.terserOptions) minimizer.options.terserOptions = {};
            if (!minimizer.options.exclude) minimizer.options.exclude = [];
            
            minimizer.options.exclude.push(/HeartbeatWorker/);
          }
        });
      }
    }
    
    return config;
  },
  optimizeFonts: true,
  experimental: {
    optimizeCss: true,
  },
  transpilePackages: [],
  // Ignore specific problematic files during build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

module.exports = nextConfig;
