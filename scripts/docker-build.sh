#!/bin/bash
echo "🐳 Building Docker images..."

# Build shared package first
cd shared && npm run build && cd ..

# Build images
docker build -t coturn-admin:latest ./admin
docker build -t coturn-node:latest ./coturn-node
docker build -t coturn-nginx:latest ./nginx

echo "✅ Docker images built successfully!"
