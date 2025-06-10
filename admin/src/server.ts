import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.API_PORT || 8080;
const PUBSUB_PORT = process.env.PUBSUB_PORT || 9001;
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes placeholder
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WebSocket Pub/Sub Server
const wss = new WebSocketServer({ port: PUBSUB_PORT });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (data) => {
    console.log('Received:', data.toString());
  });
});

// Start servers
app.listen(PORT, () => {
  console.log(`🚀 Admin API server running on port ${PORT}`);
  console.log(`📡 Pub/Sub server running on port ${PUBSUB_PORT}`);
});
