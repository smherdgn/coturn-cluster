#!/bin/bash
# 🚀 Fixed Coturn System Starter

echo "🚀 Starting Fixed Coturn System..."

# Build shared first
echo "📦 Building shared library..."
cd shared && npm run build && cd ..

# Start services with proper order
echo "🔄 Starting admin cluster (database-independent)..."
cd admin && npm run dev &
ADMIN_PID=$!

echo "⏳ Waiting for admin to start..."
sleep 5

echo "🔄 Starting coturn node..."
cd coturn-node && npm run dev &
NODE_PID=$!

echo "✅ System started!"
echo "📊 Admin Dashboard: http://localhost:8080"
echo "📡 WebSocket Pub/Sub: ws://localhost:9000"
echo "🤖 Coturn Agent: http://localhost:8100"

# Wait for user input to stop
echo "Press Ctrl+C to stop all services..."
wait

