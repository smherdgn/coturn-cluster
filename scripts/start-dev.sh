#!/bin/bash

echo "🚀 Starting Admin Server..."
(cd admin && npm run dev) &

echo "⏳ Waiting for Admin PubSub (port 9000)..."
npx wait-on tcp:9000

echo "🤖 Starting Coturn Node Agent..."
(cd coturn-node && npm run dev)
