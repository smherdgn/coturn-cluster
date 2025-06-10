🎛️ Coturn Cluster Management System
A comprehensive, enterprise-grade TURN/STUN server cluster management platform with real-time monitoring, automatic scaling, and professional web dashboard.

📋 Table of Contents
Overview
Architecture
Features
Project Structure
Installation
Configuration
Usage
Development
Deployment
API Documentation
Troubleshooting
Contributing
🎯 Overview
This project provides a complete cluster management solution for TURN/STUN servers (using Coturn), featuring:

Web Dashboard: Professional management interface
Auto-scaling: Dynamic node provisioning
Load Balancing: Nginx-based traffic distribution
Real-time Monitoring: WebSocket-based live updates
Service Discovery: Automatic node registration
Database Integration: PostgreSQL with Redis caching
Container Support: Full Docker and Kubernetes deployment
Security: JWT authentication, SSL/TLS encryption
🏗️ Architecture
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │    │   Admin API     │    │   Pub/Sub       │
│   (React-like)  │◄──►│   (Express)     │◄──►│   (WebSocket)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   REST APIs     │    │   Real-time     │
│   (HTML/CSS/JS) │    │   (CRUD Ops)    │    │   Updates       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Service       │
                    │   Registry      │
                    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   Coturn Node   │ │   Coturn Node   │ │   Coturn Node   │
    │   + Agent       │ │   + Agent       │ │   + Agent       │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                    ┌─────────────────┐
                    │   Nginx LB      │
                    │   (Upstream)    │
                    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ PostgreSQL  │ │   Redis     │ │ Monitoring  │
        │ (Metadata)  │ │  (Cache)    │ │(Prometheus) │
        └─────────────┘ └─────────────┘ └─────────────┘
✨ Features
🎛️ Management Dashboard
Real-time Overview: Live cluster status and metrics
Node Management: Add, remove, restart TURN servers
Auto IP/Port Assignment: Intelligent resource allocation
Service Discovery: Automatic node registration
Load Balancer Control: Nginx upstream management
Security Center: SSL certificates, firewall status
Monitoring Integration: Prometheus & Grafana dashboards
🔧 Technical Features
WebSocket Communication: Real-time bidirectional updates
RESTful APIs: Complete CRUD operations
Docker Support: Full containerization
Kubernetes Ready: Production orchestration
Database Persistence: PostgreSQL with connection pooling
Caching Layer: Redis for performance optimization
Service Registry: Dynamic service discovery
Health Monitoring: Automated health checks
SSL/TLS Security: End-to-end encryption
JWT Authentication: Secure API access
📁 Project Structure
coturn-cluster/
├── admin/                      # Admin Dashboard & API Server
│   ├── src/
│   │   ├── api/
│   │   │   ├── server.ts       # Express API server
│   │   │   └── node-manager.ts # Node management logic
│   │   ├── pubsub/
│   │   │   └── broker.ts       # WebSocket pub/sub broker
│   │   ├── database/
│   │   │   └── client.ts       # PostgreSQL client
│   │   ├── config/
│   │   │   └── environment.ts  # Environment configuration
│   │   └── server.ts           # Main server entry point
│   ├── public/                 # Static web assets
│   │   ├── index.html          # Main dashboard HTML
│   │   ├── css/
│   │   │   ├── main.css        # Main stylesheet
│   │   │   └── dashboard.css   # Dashboard-specific styles
│   │   └── js/
│   │       ├── app.js          # Main dashboard JavaScript
│   │       ├── dashboard.js    # Dashboard components
│   │       └── ip-generator.js # IP/Port generation utilities
│   ├── database/
│   │   └── init.sql           # Database initialization
│   ├── package.json           # Node.js dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   └── Dockerfile             # Container definition
│
├── coturn-node/               # TURN Server Agents
│   ├── src/
│   │   ├── agent.ts           # Main agent entry point
│   │   └── coturn/
│   │       ├── manager/
│   │       │   └── CoturnManager.ts    # Coturn process management
│   │       ├── config/
│   │       │   └── ConfigManager.ts   # Configuration management
│   │       ├── stats/
│   │       │   └── StatsManager.ts    # Statistics collection
│   │       ├── users/
│   │       │   └── UserManager.ts     # User management
│   │       └── process/
│   │           └── ProcessManager.ts   # Process lifecycle
│   ├── config/
│   │   └── turnserver.conf    # Coturn configuration template
│   ├── scripts/
│   │   └── supervisord.conf   # Process supervision
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── shared/                    # Shared Libraries
│   ├── src/
│   │   ├── index.ts           # Main exports
│   │   ├── constants.ts       # System constants
│   │   ├── messages.ts        # Message definitions
│   │   ├── schemas.ts         # Data schemas
│   │   ├── utils.ts           # Utility functions
│   │   ├── EnvConfig.ts       # Environment configuration
│   │   └── ServiceRegistry.ts # Service registry logic
│   ├── lib/                   # Compiled JavaScript
│   ├── package.json
│   └── tsconfig.json
│
├── nginx/                     # Load Balancer
│   ├── nginx.conf             # Main nginx configuration
│   ├── conf/
│   │   └── default.conf       # Virtual host configuration
│   ├── ssl/                   # SSL certificates
│   └── Dockerfile
│
├── k8s/                       # Kubernetes Manifests
│   ├── namespace.yaml         # Namespace definition
│   ├── admin-deployment.yaml  # Admin service deployment
│   ├── coturn-deployment.yaml # Coturn nodes deployment
│   └── hpa.yaml               # Horizontal Pod Autoscaler
│
├── monitoring/                # Monitoring Configuration
│   ├── prometheus.yml         # Prometheus configuration
│   └── coturn-dashboard.json  # Grafana dashboard definition
│
├── scripts/                   # Utility Scripts
│   ├── dev-start.sh           # Development startup
│   ├── prod-start.sh          # Production startup
│   ├── docker-build.sh        # Docker build automation
│   ├── k8s-deploy.sh          # Kubernetes deployment
│   ├── backup.sh              # Database backup
│   └── stop.sh                # Graceful shutdown
│
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Root package.json
├── .env                       # Environment variables
└── README.md                  # This file
🚀 Installation
Prerequisites
Node.js 18+ (LTS recommended)
Docker 20.10+ & Docker Compose
PostgreSQL 15+ (or use Docker)
Redis 7+ (or use Docker)
Git for version control
Quick Start
Clone the repository
bash
git clone <repository-url>
cd coturn-cluster
Install dependencies
bash
npm run install:all
Setup environment
bash
cp .env.example .env
# Edit .env with your configuration
Build shared libraries
bash
npm run build:shared
Start development environment
bash
npm run dev
Docker Deployment
Start full stack
bash
docker-compose up -d
Access dashboard
http://localhost:8080
⚙️ Configuration
Environment Variables
Create .env file in root directory:

bash
# === CORE CONFIGURATION ===
NODE_ENV=development
DEPLOYMENT_ID=your-deployment-id

# === ADMIN CONFIGURATION ===
ADMIN_API_PORT=8080
ADMIN_DASHBOARD_PORT=8080
ADMIN_PUBSUB_PORT=9000
ADMIN_PASSWORD=your-secure-password

# === COTURN CONFIGURATION ===
COTURN_PORT=3478
COTURN_TLS_PORT=5349
COTURN_MIN_PORT=49152
COTURN_MAX_PORT=65535
COTURN_SECRET=your-coturn-secret
COTURN_AGENT_PORT=8100

# === DATABASE CONFIGURATION ===
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=coturn_cluster
POSTGRES_USER=coturn_admin
POSTGRES_PASSWORD=your-db-password

# === REDIS CONFIGURATION ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# === SECURITY CONFIGURATION ===
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SESSION_SECRET=your-session-secret
ENCRYPTION_KEY=your-encryption-key
API_KEY=your-api-key

# === NETWORK CONFIGURATION ===
HTTP_PORT=80
HTTPS_PORT=443

# === MONITORING CONFIGURATION ===
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
Dashboard Configuration
The dashboard automatically discovers and displays:

Connected Nodes: Auto-registered TURN servers
Service Status: Real-time health monitoring
Performance Metrics: CPU, memory, network usage
Load Balancer: Nginx upstream configuration
Security Status: SSL certificates, firewall rules
📊 Usage
Web Dashboard
Access the dashboard
http://localhost:8080
Navigate sections:
Overview: Cluster summary and live metrics
Nodes: TURN server management
Services: Service registry and health
Load Balancer: Nginx configuration
Security: SSL and firewall management
Monitoring: Performance dashboards
Adding TURN Nodes
Via Dashboard:
Navigate to "Nodes" section
Click "Add Node (Auto IP/Port)"
Configure IP address and ports
Enable auto-registration with nginx
Submit to create the node
Via API:
bash
curl -X POST http://localhost:8080/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.10",
    "ports": {
      "agent": 8101,
      "turn": 3479,
      "tls": 5350
    },
    "autoRegisterNginx": true
  }'
Managing Load Balancer
View upstream configuration:
bash
curl http://localhost:8080/api/nginx/status
Reload nginx configuration:
bash
curl -X POST http://localhost:8080/api/nginx/reload
🛠️ Development
Development Environment
Start shared library compilation:
bash
cd shared && npm run dev
Start admin server:
bash
cd admin && npm run dev
Start coturn agent:
bash
cd coturn-node && npm run dev
Building for Production
bash
# Build all components
npm run build

# Build specific component
npm run build:admin
npm run build:node
npm run build:shared
Running Tests
bash
# Run all tests
npm test

# Run specific component tests
cd admin && npm test
cd coturn-node && npm test
cd shared && npm test
Code Quality
bash
# Lint all TypeScript files
npm run lint

# Format code
npm run format
🚀 Deployment
Docker Compose
bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale coturn nodes
docker-compose up -d --scale coturn-node=5
Kubernetes
bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Scale deployment
kubectl scale deployment coturn-nodes --replicas=5

# Check status
kubectl get pods -n coturn-cluster
Production Checklist
 Configure environment variables
 Setup SSL certificates
 Configure firewall rules
 Setup database backups
 Configure monitoring alerts
 Test disaster recovery
 Setup log aggregation
 Configure auto-scaling
📚 API Documentation
Core Endpoints
Health Check
GET /health
Node Management
GET    /api/nodes           # List all nodes
POST   /api/nodes           # Add new node
DELETE /api/nodes/:id       # Remove node
POST   /api/nodes/:id/restart # Restart node
Service Registry
GET /api/services           # List services
Load Balancer
GET  /api/nginx/status       # Get nginx status
POST /api/nginx/reload       # Reload configuration
POST /api/nginx/upstream/toggle # Toggle server
Security
GET  /api/security/status    # Security overview
POST /api/security/scan      # Run security scan
POST /api/security/certificates/renew # Renew SSL
Debug Information
GET /api/debug              # System debug info
WebSocket Events
The system uses WebSocket for real-time communication:

Client → Server
javascript
{
  "type": "heartbeat",
  "nodeId": "node-001",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "status": "healthy",
    "stats": { ... }
  }
}
Server → Client
javascript
{
  "type": "node_update",
  "nodeId": "node-001",
  "status": "healthy",
  "metadata": { ... }
}
🐛 Troubleshooting
Common Issues
Port Already in Use
bash
# Find process using port
lsof -ti:8080,9000,8100 | xargs kill -9

# Or kill specific processes
pkill -f "tsx.*server"
pkill -f "tsx.*agent"
Docker Build Fails
bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
JavaScript Syntax Errors
bash
# Check for syntax issues
node -c admin/public/js/app.js

# Clear browser cache
# Use hard refresh (Cmd+Shift+R)
Database Connection Issues
bash
# Check PostgreSQL status
docker-compose logs postgres

# Verify connection
psql -h localhost -U coturn_admin -d coturn_cluster
Service Registry Issues
bash
# Check WebSocket connection
curl -H "Upgrade: websocket" http://localhost:9000

# Verify service registration
curl http://localhost:8080/api/services
Debug Mode
Enable debug logging:

bash
DEBUG=coturn:* npm run dev
Performance Issues
Monitor resource usage:
bash
docker stats
Check database performance:
sql
SELECT * FROM pg_stat_activity;
Monitor Redis:
bash
redis-cli info memory
🤝 Contributing
Development Workflow
Fork the repository
Create feature branch: git checkout -b feature/amazing-feature
Make changes and test
Commit changes: git commit -m 'Add amazing feature'
Push to branch: git push origin feature/amazing-feature
Create Pull Request
Code Standards
TypeScript: Strict mode enabled
ESLint: Airbnb configuration
Prettier: Code formatting
Jest: Unit testing
Conventional Commits: Commit message format
Testing Requirements
Unit tests for all utility functions
Integration tests for API endpoints
E2E tests for critical user flows
Performance tests for WebSocket communication
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Coturn Project: TURN/STUN server implementation
Express.js: Web framework
TypeScript: Type-safe JavaScript
Docker: Containerization platform
PostgreSQL: Database system
Redis: Caching solution
Nginx: Load balancer
Prometheus: Monitoring system
📞 Support
Documentation: Check this README and inline code comments
Issues: Create GitHub issues for bugs and feature requests
Discussions: Use GitHub Discussions for questions
Security: Report security issues privately
Built with ❤️ for reliable WebRTC infrastructure

