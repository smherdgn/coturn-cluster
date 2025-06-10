# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared library first
COPY shared/ ./shared/

# Copy admin package files
COPY admin/package*.json ./admin/
COPY admin/tsconfig.json ./admin/

# Build shared first
WORKDIR /app/shared
RUN npm ci && npm run build

# Install admin dependencies
WORKDIR /app/admin
RUN npm ci

# Copy admin source
COPY admin/src/ ./src/
COPY admin/public/ ./public/

# Build admin - ensuring the output goes to correct location
RUN npm run build

# Debug: List contents to see what was built
RUN ls -la dist/

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built files from admin directory
COPY --from=builder /app/admin/dist ./dist
COPY --from=builder /app/admin/public ./public
COPY --from=builder /app/admin/package*.json ./

# Copy shared library to expected location
COPY --from=builder /app/shared/dist ./shared/lib

# Install production dependencies
RUN npm ci --only=production

EXPOSE 3000 8081 9001

CMD ["npm", "start"]