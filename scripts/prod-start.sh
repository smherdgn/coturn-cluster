#!/bin/bash

echo "🚀 Starting Coturn Cluster Production Environment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "❌ .env file not found."
    exit 1
fi

# Build and start services
echo "🔨 Building images..."
docker-compose build

echo "🚀 Starting production services..."
docker-compose up -d

# Health check
echo "🏥 Running health checks..."
sleep 10

if curl -f http://localhost:$ADMIN_API_PORT/health > /dev/null 2>&1; then
    echo "✅ Services are healthy!"
    echo "📊 Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
    echo "🔌 API: http://localhost:$ADMIN_API_PORT"
else
    echo "❌ Health check failed!"
    docker-compose logs
    exit 1
fi
