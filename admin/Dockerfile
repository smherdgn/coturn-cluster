# Basit ve Güvenilir Çözüm - Admin Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Tüm dosyaları kopyala
COPY . .

# Shared'ı önce build et
WORKDIR /app/shared
RUN npm ci && npm run build

# Admin'i build et
WORKDIR /app/admin
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Build edilmiş dosyaları kopyala
COPY --from=builder /app/admin/dist ./dist
COPY --from=builder /app/admin/public ./public
COPY --from=builder /app/admin/package*.json ./

# Shared library dosyalarını kopyala
COPY --from=builder /app/shared/lib ./shared-lib/

# Node modules'ü kopyala (shared bağımlılığı dahil)
COPY --from=builder /app/admin/node_modules ./node_modules

# Shared library'yi symlink ile bağla
RUN mkdir -p ./node_modules/@coturn-cluster && \
    ln -sf /app/shared-lib ./node_modules/@coturn-cluster/shared

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S coturn -u 1001 && \
    chown -R coturn:nodejs /app

USER coturn

EXPOSE 3000

CMD ["node", "dist/server.js"]