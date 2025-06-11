# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY shared/package*.json ./shared/
COPY coturn-node/package*.json ./coturn-node/
COPY coturn-node/tsconfig.json ./coturn-node/

# Install dependencies
RUN cd shared && npm ci
RUN cd coturn-node && npm ci

# Copy and build shared
COPY shared/ ./shared/
WORKDIR /app/shared
RUN npm run build

# Copy and build coturn-node
WORKDIR /app
COPY coturn-node/src/ ./coturn-node/src/
COPY coturn-node/config/ ./coturn-node/config/
COPY coturn-node/coturn-config/ ./coturn-node/coturn-config/

WORKDIR /app/coturn-node
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install coturn
RUN apk add --no-cache coturn

WORKDIR /app

# Copy built files
COPY --from=builder /app/coturn-node/dist ./dist
COPY --from=builder /app/coturn-node/config ./config
COPY --from=builder /app/coturn-node/coturn-config ./coturn-config
COPY --from=builder /app/coturn-node/package*.json ./

# Copy shared library to node_modules for package resolution
COPY --from=builder /app/shared/dist ./node_modules/@coturn-cluster/shared/
COPY --from=builder /app/shared/package.json ./node_modules/@coturn-cluster/shared/

# Install production dependencies
RUN npm ci --only=production

EXPOSE 8100 3478 5349

CMD ["npm", "start"]