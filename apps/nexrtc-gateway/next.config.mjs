"use client";

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'no-referrer-when-downgrade',
  },
  ...(isProd
    ? [
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
        },
      ]
    : []),
];

const corsHeaders = [
  {
    key: 'Access-Control-Allow-Origin',
    value: '*',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET,POST,PUT,DELETE,OPTIONS',
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization',
  },
];

export default {
  reactStrictMode: true,

  experimental: {
    appDir: true,
    serverActions: true,
  },

  async headers() {
    return [
      {
        // API endpoint'lerine CORS ve güvenlik
        source: '/api/:path*',
        headers: [...securityHeaders, ...corsHeaders],
      },
      {
        // Tüm frontend route'lara sadece security headers
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
