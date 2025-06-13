#!/bin/bash

# WebRTC Signaling Server - Project Setup
echo "🚀 Setting up WebRTC Signaling Server project structure..."

# Create project directory
mkdir -p signaling-server
cd signaling-server

# Create folder structure
echo "📁 Creating folder structure..."
mkdir -p src/{auth,websocket,signaling,shared/{types,config,database,redis,utils}}

# Create package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "webrtc-signaling-server",
  "version": "1.0.0",
  "description": "WebRTC Signaling Server with TypeScript, Fastify, and Socket.io",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/shared/database/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["webrtc", "signaling", "typescript", "fastify", "socket.io"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/rate-limit": "^9.1.0",
    "fastify": "^4.28.1",
    "socket.io": "^4.7.5",
    "drizzle-orm": "^0.30.10",
    "postgres": "^3.4.4",
    "redis": "^4.6.13",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "winston": "^3.13.0",
    "zod": "^3.23.8",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.6",
    "typescript": "^5.4.5",
    "tsx": "^4.10.5",
    "drizzle-kit": "^0.21.2",
    "@typescript-eslint/eslint-plugin": "^7.9.0",
    "@typescript-eslint/parser": "^7.9.0",
    "eslint": "^8.57.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create tsconfig.json
echo "⚙️ Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/shared/*": ["src/shared/*"],
      "@/auth/*": ["src/auth/*"],
      "@/websocket/*": ["src/websocket/*"],
      "@/signaling/*": ["src/signaling/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF

# Create .env.example
echo "🔧 Creating environment configuration template..."
cat > .env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/webrtc_signaling
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webrtc_signaling
DB_USER=postgres
DB_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# WebRTC Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVERS=

# Room Configuration
MAX_ROOM_SIZE=8
ROOM_CLEANUP_INTERVAL=300000
SESSION_TIMEOUT=3600000
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# macOS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.sqlite
*.db

# Temporary files
tmp/
temp/
EOF

# Create empty index files for modules
echo "📄 Creating module index files..."

# Auth module index
cat > src/auth/index.ts << 'EOF'
// Auth module exports
// Will be implemented in later phases
export {};
EOF

# WebSocket module index
cat > src/websocket/index.ts << 'EOF'
// WebSocket module exports
// Will be implemented in later phases
export {};
EOF

# Signaling module index
cat > src/signaling/index.ts << 'EOF'
// Signaling module exports
// Will be implemented in later phases
export {};
EOF

# Create logs directory
mkdir -p logs

echo "✅ Project setup completed!"
echo "📋 Next steps:"
echo "   1. cd signaling-server"
echo "   2. npm install"
echo "   3. cp .env.example .env"
echo "   4. Edit .env with your configuration"
echo "   5. Run ./02-database-layer.sh"

echo ""
echo "🔧 Run all setup scripts in order:"
echo "   chmod +x *.sh && ./01-project-setup.sh && ./02-database-layer.sh && ./03-redis-config.sh && ./04-shared-types-utils.sh && ./05-server-bootstrap.sh"