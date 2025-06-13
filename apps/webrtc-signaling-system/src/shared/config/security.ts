import { config } from './index';

// Security configuration
export const securityConfig = {
  // Helmet configuration for security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Socket.IO admin UI
          "'unsafe-eval'", // Required for some WebRTC operations
          "https://cdnjs.cloudflare.com", // For CDN resources
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Socket.IO admin UI
          "https://fonts.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:", // Required for WebRTC media streams
        ],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "https:", // For STUN/TURN servers
          config.cors.origin.join(' '),
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        objectSrc: ["'none'"],
        mediaSrc: [
          "'self'",
          "blob:", // Required for WebRTC media
        ],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: config.env === 'production' ? [] : null,
      },
      reportOnly: config.env === 'development',
    },
    crossOriginEmbedderPolicy: {
      policy: "credentialless", // Required for SharedArrayBuffer in WebRTC
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    originAgentCluster: true,
    dnsPrefetchControl: {
      allow: false,
    },
    frameguard: {
      action: 'deny',
    },
    permittedCrossDomainPolicies: false,
    hidePoweredBy: true,
    xssFilter: true,
  },

  // CORS configuration
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow localhost with any port
      if (config.env === 'development') {
        const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
        const ip127Regex = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
        
        if (localhostRegex.test(origin) || ip127Regex.test(origin)) {
          return callback(null, true);
        }
      }
      
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
      'Cache-Control',
      'Pragma',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
    ],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },

  // Rate limiting configuration
  rateLimit: {
    global: {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowMs,
      allowList: ['127.0.0.1', '::1'], // Localhost exemption
      errorResponseBuilder: (_request: any, context: any) => ({
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: context.max,
        remaining: context.remaining,
        resetTime: new Date(Date.now() + context.ttl),
        retryAfter: Math.round(context.ttl / 1000),
        timestamp: new Date(),
      }),
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
      skipOnError: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // Specific rate limits for different endpoints
    auth: {
      max: 10, // 10 login attempts
      timeWindow: 15 * 60 * 1000, // 15 minutes
      skipSuccessfulRequests: true,
    },
    
    api: {
      max: 200, // 200 API calls
      timeWindow: 15 * 60 * 1000, // 15 minutes
    },
    
    socket: {
      max: 1000, // 1000 socket events
      timeWindow: 60 * 1000, // 1 minute
    },
  },

  // Trusted proxies configuration
  trustedProxies: [
    '127.0.0.1',
    '::1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'fc00::/7',
  ],

  // Session security
  session: {
    name: 'webrtc.sid',
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: config.env === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
    },
  },
} as const;

// Security headers for static files
export const staticSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=self',
    'microphone=self',
    'display-capture=self',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '),
} as const;
