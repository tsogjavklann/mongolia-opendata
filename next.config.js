/** @type {import('next').NextConfig} */
// CORS — production-д тодорхой origin зөвшөөрнө, dev-д * ашиглана
const corsOrigin = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : '*');

const nextConfig = {
  async headers() {
    const apiHeaders = [
      { key: 'Vary', value: 'Origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    if (corsOrigin) {
      apiHeaders.unshift({ key: 'Access-Control-Allow-Origin', value: corsOrigin });
    }
    return [
      { source: '/api/:path*', headers: apiHeaders },
      {
        source: '/(tables|aliases).json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
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
  },
};

module.exports = nextConfig;
