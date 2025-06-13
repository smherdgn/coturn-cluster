export default {
  async headers() {
    const securityHeaders = [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'Referrer-Policy',
        value: 'no-referrer-when-downgrade'
      },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
      }
    ];

    const corsHeaders = [
      {
        key: 'Access-Control-Allow-Origin',
        value: '*'
      },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET,POST,PUT,DELETE,OPTIONS'
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization'
      }
    ];

    return [
      {
        source: '/api/:path*',
        headers: [...securityHeaders, ...corsHeaders]
      },
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};
