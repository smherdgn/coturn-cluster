#!/bin/bash

echo "🚀 Starting Coturn Cluster Development Environment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "❌ .env file not found. Run setup script first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database first
echo "🐘 Starting PostgreSQL..."
docker-compose up postgres -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
until docker-compose exec postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    sleep 2
done

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Show status
echo "✅ Services started!"
echo "📊 Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
echo "🔌 API: http://localhost:$ADMIN_API_PORT"
echo "📡 Pub/Sub: ws://localhost:$ADMIN_PUBSUB_PORT"
echo "🐘 PostgreSQL: localhost:$POSTGRES_PORT"

# Follow logs
docker-compose logs -f
