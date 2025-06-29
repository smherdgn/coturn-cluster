# Coturn Cluster - Clean Project Structure

## 📁 Directory Structure
```
coturn-cluster/
├── apps/admin                     # Admin Dashboard & API Server
│   ├── admin-api/               # Backend Server (Node.js, Express.js)
│   │   ├── src/
│   │   │   ├── api/             # API Layer: Handles HTTP requests and responses
│   │   │   │   ├── controllers/ # Request handlers, orchestrates services
│   │   │   │   ├── routes/      # Defines API endpoints and connects them to controllers
│   │   │   │   ├── services/    # Core Business Logic (e.g., k8s, user, network services)
│   │   │   │   ├── database/    # Database client, connection pool, and migrations
│   │   │   │   └── templates/   # Templates for dynamic configurations (e.g., YAML)
│   │   │   │
│   │   │   ├── config/          # Environment variables and app configuration
│   │   │   ├── database/        # Additional files related to the database (init.sql, ...)
│   │   │   ├── pubsub/          # WebSocket server for real-time communication
│   │   │   └── server.ts        # Main server entry point (initializes Express app)
│   │   │
│   │   ├── Dockerfile           # Dockerizes the backend API for production
│   │   ├── package.json         # Backend dependencies (express, pg, ws, etc.)
│   │   └── tsconfig.json        # TypeScript configuration for the backend
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
