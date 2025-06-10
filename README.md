# 🔄 Coturn Cluster

Enterprise-grade TURN/STUN server cluster with professional management dashboard.

## ✨ Features

- 🎛️ **Professional Dashboard** - Complete cluster management
- 🔧 **Service Registry** - Dynamic service discovery  
- 📊 **Real-time Monitoring** - Performance metrics & health
- 🗄️ **Database Management** - PostgreSQL integration
- 📦 **Redis Caching** - High-performance caching
- 🐳 **Docker Ready** - Full containerization
- ☸️ **Kubernetes** - Production orchestration
- 📈 **Monitoring** - Prometheus & Grafana integration

## 🚀 Quick Start

```bash
# 1. Setup cluster
./setup-coturn-cluster.sh

# 2. Install dependencies
cd admin && npm install
cd ../coturn-node && npm install  
cd ../shared && npm install

# 3. Start development
./scripts/dev-start.sh
```

## 🎯 Access Points

- **Dashboard:** http://localhost:8080
- **API:** http://localhost:8080/api
- **WebSocket:** ws://localhost:9000
- **TURN Server:** localhost:3478

## 📊 Dashboard Features

- **Overview:** Cluster status & metrics
- **Nodes:** Add/remove/monitor nodes
- **Services:** Service discovery & health
- **Database:** PostgreSQL management
- **Redis:** Cache monitoring
- **Logs:** Real-time log viewer
- **Config:** Environment management
- **Monitoring:** Performance charts

## 🔧 Management

```bash
# Start development
./scripts/dev-start.sh

# Start production  
./scripts/prod-start.sh

# Multiple nodes
./scripts/start-multiple-nodes.sh 5

# Stop cluster
./scripts/stop.sh

# Backup
./scripts/backup.sh
```

## 🏗️ Architecture

- **Admin Layer:** Management dashboard & API
- **Node Layer:** TURN/STUN servers with agents
- **Data Layer:** PostgreSQL + Redis
- **Service Layer:** Discovery & health monitoring
- **Network Layer:** Load balancing & routing

## 📝 Configuration

All configuration is managed through:
- `.env` file for environment variables
- `docker-compose.yml` for services
- Dashboard UI for runtime config

## 🔒 Security

- JWT authentication
- Encrypted passwords  
- TLS/SSL support
- Role-based access
- Audit logging

## 📈 Monitoring

- Prometheus metrics
- Grafana dashboards
- Real-time alerts
- Health checks
- Performance tracking

## 🐳 Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## ☸️ Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Scale nodes
kubectl scale deployment coturn-node --replicas=5
```

Built with ❤️ for enterprise TURN/STUN deployments.
