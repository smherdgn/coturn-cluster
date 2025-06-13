#!/bin/bash

echo "🧪 Testing Coturn Integration..."

echo "📦 Building TypeScript..."
cd coturn-node && npm run build

echo "🔧 Starting test instance..."
node dist/agent.js &
AGENT_PID=$!

sleep 5

echo "🏥 Testing health endpoint..."
curl -s http://localhost:8082/health | jq .

echo "📊 Testing stats endpoint..."
curl -s http://localhost:8082/stats | jq .

echo "🛑 Stopping test instance..."
kill $AGENT_PID

echo "✅ Integration test completed!"
