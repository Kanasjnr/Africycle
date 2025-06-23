/** @type {import('next').NextConfig} */

// Custom plugin to completely ignore HeartbeatWorker files
class IgnoreHeartbeatWorkerPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('IgnoreHeartbeatWorkerPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('IgnoreHeartbeatWorkerPlugin', (resolveData) => {
        if (resolveData.request && resolveData.request.includes('HeartbeatWorker')) {
          return false; // Ignore this module completely
        }
      });
    });
  }
}

const nextConfig = {
  reactStrictMode: true,
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
  webpack: (config, { isServer, dev }) => {
    // Basic fallbacks
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    
    if (!isServer) {
      // CUSTOM PLUGIN - First line of defense
      config.plugins.push(new IgnoreHeartbeatWorkerPlugin());
      
      // AGGRESSIVE HeartbeatWorker exclusion - multiple strategies
      
      // Strategy 1: Alias to false
      config.resolve.alias = {
        ...config.resolve.alias,
        'HeartbeatWorker.js': false,
        'HeartbeatWorker': false,
        './HeartbeatWorker': false,
        './HeartbeatWorker.js': false,
      };
      
      // Strategy 2: Multiple null-loader rules
      config.module.rules.push(
        {
          test: /HeartbeatWorker\.(js|ts)$/,
          use: 'null-loader'
        },
        {
          test: /.*HeartbeatWorker.*\.(js|ts)$/,
          use: 'null-loader'
        },
        {
          test: /HeartbeatWorker/,
          use: 'null-loader'
        }
      );
      
      // Strategy 3: Ignore plugin to completely exclude HeartbeatWorker
      const IgnorePlugin = require('webpack').IgnorePlugin;
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /HeartbeatWorker/,
        })
      );
      
      // Strategy 4: Modify Terser to exclude HeartbeatWorker files
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            // Clone the plugin options and add exclude pattern
            const newOptions = {
              ...plugin.options,
              exclude: [
                /HeartbeatWorker/,
                /.*HeartbeatWorker.*/,
                ...(plugin.options.exclude ? [plugin.options.exclude].flat() : [])
              ]
            };
            
            // Create new instance with updated options
            const TerserPlugin = require('terser-webpack-plugin');
            return new TerserPlugin(newOptions);
          }
          return plugin;
        });
      }
      
      // Strategy 5: Additional externals for problematic packages
      config.externals = {
        ...config.externals,
        'HeartbeatWorker': 'HeartbeatWorker',
        'HeartbeatWorker.js': 'HeartbeatWorker',
      };
    }
    
    return config;
  },
  optimizeFonts: true,
  experimental: {},
  transpilePackages: [],
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Additional configuration for better Netlify compatibility
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build to avoid blocking
  },
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checking
  },
  
  // Output configuration for static export compatibility
  trailingSlash: false,
  
  // Disable problematic features that might interfere
  swcMinify: true,
};

module.exports = nextConfig;
