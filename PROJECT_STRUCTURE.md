# Coturn Cluster - Clean Project Structure

## 📁 Directory Structure
```
coturn-cluster/
├── apps/admin                     # Admin Dashboard & API Server
│   ├── admin-api/                 # Backend Server (Express.js, Node.js)
│   │   ├── src/
│   │   │   ├── api/               # API endpoints and routers (exaple: /nodes, /users)
│   │   │   ├── database/          # Database connection logic, queries
│   │   │   ├── pubsub/            # WebSocket server logic
│   │   │   ├── services/          # Business Logic
│   │   │   └── server.ts          # Main server entry point (Express app launch)
│   │   │
│   │   ├── database/              # Additional files related to the database
│   │   │   └── init.sql           # <-- Database initialization
│   │   │
│   │   ├── Dockerfile             # To Dockerize Backend
│   │   ├── package.json           # Backend dependencies (express, pg, ws, bcryptjs...)
│   │   └── tsconfig.json          # TypeScript configuration for backend
│   │
│   └── admin-ui/                  # Frontend Interface (React, Vite)
│       ├── public/                # Static files like robots.txt, Favicon
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       ├── Dockerfile             # To serve the frontend with Nginx (multi-stage)
│       ├── nginx.conf             # Nginx configuration file (for SPA)
│       ├── package.json           # Frontend dependencies (react, react-dom, vite...)
│       ├── tsconfig.json.         # TypeScript configuration for frontend
│       └── vite.config.ts         # Gear configuration (with proxy settings)
│
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
