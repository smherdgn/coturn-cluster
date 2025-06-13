#!/bin/bash

# WebRTC Signaling Server - Complete Setup Script
echo "🚀 WebRTC Signaling Server - Complete Setup"
echo "============================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Create logs directory
mkdir -p logs

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
until docker-compose exec postgres pg_isready -U postgres -d webrtc_signaling; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

until docker-compose exec redis redis-cli ping; do
    echo "Waiting for Redis..."
    sleep 2
done

echo "✅ Services are ready"

# Generate and run database migrations
echo "🗄️ Setting up database..."
npm run db:generate
npm run db:migrate

echo "✅ Database setup completed"

# Start the application
echo "🚀 Starting signaling server..."
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Test the server
echo "🧪 Testing server health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server is running and healthy!"
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📊 Services:"
    echo "   • Signaling Server: http://localhost:3000"
    echo "   • Health Check: http://localhost:3000/health"
    echo "   • API Status: http://localhost:3000/api/v1/status"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo "   • pgAdmin: http://localhost:8080 (admin@webrtc.local / admin)"
    echo "   • Redis Commander: http://localhost:8081 (admin / admin)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Edit .env file with your configuration"
    echo "   2. Implement auth module in src/auth/"
    echo "   3. Implement websocket module in src/websocket/"
    echo "   4. Implement signaling module in src/signaling/"
    echo ""
    echo "🛑 To stop: kill $SERVER_PID && docker-compose down"
else
    echo "❌ Server health check failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
