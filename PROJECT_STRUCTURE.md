# Coturn Cluster - Clean Project Structure

## 📁 Directory Structure
```
coturn-cluster/
├── admin/                    # Admin Dashboard & API
│   ├── src/
│   │   ├── api/             # REST API endpoints
│   │   ├── database/        # Database client
│   │   ├── pubsub/          # WebSocket broker
│   │   ├── public/          # Dashboard files
│   │   └── services/        # Business logic
│   ├── public/              # Static files
│   ├── package.json
│   └── Dockerfile
├── coturn-node/             # TURN/STUN nodes
│   ├── src/
│   │   ├── agent.ts         # Node agent
│   │   └── coturn/          # Coturn managers
│   ├── config/              # Coturn config
│   ├── package.json
│   └── Dockerfile
├── shared/                  # Shared libraries
│   ├── src/                 # TypeScript source
│   ├── lib/                 # Compiled JS
│   └── package.json
├── nginx/                   # Load balancer
├── k8s/                     # Kubernetes manifests
├── monitoring/              # Prometheus/Grafana
├── scripts/                 # Deployment scripts
├── logs/                    # Application logs
├── backups/                 # Backups
├── docker-compose.yml       # Docker orchestration
├── setup-coturn-cluster.sh  # Main setup script
└── README.md
```

## 🚀 Usage
1. Setup: `./setup-coturn-cluster.sh`
2. Development: `./scripts/dev-start.sh`
3. Production: `./scripts/prod-start.sh`
4. Stop: `./scripts/stop.sh`

## 🎛️ Dashboard
- Main: http://localhost:8080
- Professional UI with node management
- Real-time monitoring
- Service registry
