/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@duckdb/node-api', '@duckdb/node-bindings'];
    } else {
      // Client bundle-д Node.js built-in module-уудыг хориглох
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@duckdb/node-api', '@duckdb/node-bindings'],
    outputFileTracingIncludes: {
      '/api/sqlrun': ['./public/aliases.json'],
      '/api/run': ['./public/aliases.json'],
      '/api/ai/sql': ['./public/aliases.json'],
    },
  },
};

module.exports = nextConfig;
