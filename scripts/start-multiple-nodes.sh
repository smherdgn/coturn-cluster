#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "❌ .env file not found."
    exit 1
fi

NODE_COUNT=${1:-3}

echo "🚀 Starting $NODE_COUNT Coturn nodes..."

# Start admin and database first
docker-compose up postgres admin -d

# Wait for admin to be ready
echo "⏳ Waiting for admin to be ready..."
sleep 10

# Start multiple coturn nodes
for i in $(seq 1 $NODE_COUNT); do
    PORT=$((COTURN_AGENT_PORT + i - 1))
    TURN_PORT=$((COTURN_PORT + i - 1))
    TLS_PORT=$((COTURN_TLS_PORT + i - 1))
    
    echo "🎯 Starting coturn-node-$i on ports $PORT/$TURN_PORT/$TLS_PORT"
    
    docker run -d \
        --name coturn-node-$i \
        --network coturn-cluster_coturn-net \
        -p $TURN_PORT:$TURN_PORT/udp \
        -p $TLS_PORT:$TLS_PORT/tcp \
        -p $PORT:$PORT \
        -e NODE_ID=coturn-node-$i \
        -e ADMIN_PUBSUB_URL=ws://admin:$ADMIN_PUBSUB_PORT \
        -e COTURN_AGENT_PORT=$PORT \
        -e COTURN_PORT=$TURN_PORT \
        -e COTURN_TLS_PORT=$TLS_PORT \
        coturn-cluster_coturn-node
done

echo "✅ $NODE_COUNT nodes started!"
