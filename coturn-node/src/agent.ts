import express from 'express';
import WebSocket from 'ws';

const app = express();
const PORT = process.env.AGENT_PORT || 8080;
const ADMIN_URL = process.env.ADMIN_PUBSUB_URL || 'ws://admin:9001';
const NODE_ID = process.env.NODE_ID || 'coturn-node-1';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    nodeId: NODE_ID,
    timestamp: new Date().toISOString() 
  });
});

// Connect to admin pub/sub
const ws = new WebSocket(ADMIN_URL);

ws.on('open', () => {
  console.log(`🔗 Connected to admin pub/sub: ${ADMIN_URL}`);
  
  // Register node
  ws.send(JSON.stringify({
    channel: 'node.register',
    data: {
      nodeId: NODE_ID,
      ip: '127.0.0.1', // Will be replaced with actual IP
      ports: {
        turn: 3478,
        turns: 5349,
        agent: PORT
      }
    }
  }));
});

ws.on('message', (data) => {
  console.log('Received message:', data.toString());
});

app.listen(PORT, () => {
  console.log(`🤖 Agent server running on port ${PORT}`);
});
