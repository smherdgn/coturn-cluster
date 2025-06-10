# 🔄 Coturn Cluster

Scalable Coturn TURN/STUN server cluster with WebSocket pub/sub management and Kubernetes orchestration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Docker development
npm run docker:up

# Kubernetes deployment
npm run k8s:deploy
```

## 📁 Project Structure

```
coturn-cluster/
├── admin/              # Management dashboard & pub/sub broker
├── coturn-node/        # Coturn server with agent
├── shared/             # Shared message schemas & utilities
├── k8s/                # Kubernetes manifests
├── nginx/              # Load balancer configuration
└── scripts/            # Deployment & utility scripts
```

## 🔧 Architecture

- **Admin**: WebSocket pub/sub broker + REST API + Dashboard
- **Coturn Nodes**: Auto-scaling TURN servers with management agents
- **Kubernetes**: Container orchestration with HPA
- **NGINX**: Load balancing and TLS termination

## 📡 Pub/Sub Channels

- `user.*` - User management (add/delete/update)
- `config.*` - Configuration synchronization
- `node.*` - Node registration & health
- `stats.*` - Real-time monitoring
- `process.*` - Process control

## 🛠️ Development

```bash
# Run admin only
npm run dev:admin

# Run coturn node only  
npm run dev:node

# Build all
npm run build

# Run tests
npm run test
```
