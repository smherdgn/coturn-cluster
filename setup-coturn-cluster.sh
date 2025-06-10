#!/bin/bash

# ========================================
# COTURN CLUSTER MASTER SETUP SCRIPT
# Service Registry Enabled Configuration
# ========================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project info
PROJECT_NAME="coturn-cluster"
SCRIPT_VERSION="2.0.0"

# ========================================
# UTILITY FUNCTIONS
# ========================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# Generate secure passwords
generate_password() { openssl rand -base64 ${1:-32} | tr -d "=+/" | cut -c1-${1:-32}; }
generate_jwt_secret() { openssl rand -base64 64 | tr -d "\n"; }
generate_uuid() { uuidgen | tr '[:upper:]' '[:lower:]'; }

# Find available port
find_available_port() {
    local start_port=${1:-8000}
    local end_port=${2:-9000}
    for port in $(seq $start_port $end_port); do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return
        fi
    done
    echo $((RANDOM % 10000 + 50000))
}

# ========================================
# CONFIGURATION FUNCTIONS
# ========================================

assign_ports() {
    log_step "🔍 Finding available ports..."
    
    # Service Registry ports
    ADMIN_API_PORT=$(find_available_port 8080 8090)
    ADMIN_DASHBOARD_PORT=$(find_available_port 3000 3010)
    ADMIN_PUBSUB_PORT=$(find_available_port 9000 9010)
    
    # Database ports
    POSTGRES_PORT=$(find_available_port 5432 5440)
    REDIS_PORT=$(find_available_port 6379 6390)
    
    # Coturn ports
    COTURN_PORT=$(find_available_port 3478 3490)
    COTURN_TLS_PORT=$(find_available_port 5349 5360)
    COTURN_AGENT_PORT=$(find_available_port 8100 8110)
    
    # Media relay ports
    COTURN_MIN_PORT=$(find_available_port 49152 49200)
    COTURN_MAX_PORT=$((COTURN_MIN_PORT + 1000))
    
    # Web ports
    HTTP_PORT=$(find_available_port 80 90)
    HTTPS_PORT=$(find_available_port 443 453)
    
    # Monitoring ports
    PROMETHEUS_PORT=$(find_available_port 9090 9100)
    GRAFANA_PORT=$(find_available_port 3300 3310)
    
    log_success "✅ Ports assigned"
    log_info "Admin API: $ADMIN_API_PORT | Dashboard: $ADMIN_DASHBOARD_PORT | Pub/Sub: $ADMIN_PUBSUB_PORT"
    log_info "PostgreSQL: $POSTGRES_PORT | Coturn: $COTURN_PORT | Agent: $COTURN_AGENT_PORT"
}

generate_passwords() {
    log_step "🔐 Generating secure passwords..."
    
    # Service Registry secrets
    JWT_SECRET=$(generate_jwt_secret)
    JWT_REFRESH_SECRET=$(generate_jwt_secret)
    
    # Database passwords
    POSTGRES_PASSWORD=$(generate_password 24)
    POSTGRES_ADMIN_PASSWORD=$(generate_password 24)
    REDIS_PASSWORD=$(generate_password 20)
    
    # Service passwords
    ADMIN_PASSWORD=$(generate_password 16)
    API_KEY=$(generate_uuid)
    
    # Coturn secrets
    COTURN_SECRET=$(openssl rand -hex 32)
    COTURN_AUTH_SECRET=$(openssl rand -hex 32)
    
    # Encryption keys
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    SESSION_SECRET=$(generate_password 32)
    
    log_success "✅ Passwords generated securely"
}

# ========================================
# FILE CREATION FUNCTIONS
# ========================================

create_env_file() {
    log_step "📝 Creating .env file..."
    
    cat > .env << EOF
# ========================================
# COTURN CLUSTER CONFIGURATION
# Generated: $(date)
# Version: $SCRIPT_VERSION
# ========================================

# Environment
NODE_ENV=development
DEPLOYMENT_ID=$API_KEY

# Service Registry Configuration
ADMIN_API_PORT=$ADMIN_API_PORT
ADMIN_DASHBOARD_PORT=$ADMIN_DASHBOARD_PORT
ADMIN_PUBSUB_PORT=$ADMIN_PUBSUB_PORT
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Database Configuration
POSTGRES_PORT=$POSTGRES_PORT
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_ADMIN_PASSWORD=$POSTGRES_ADMIN_PASSWORD
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=$REDIS_PASSWORD

# Coturn Configuration
COTURN_PORT=$COTURN_PORT
COTURN_TLS_PORT=$COTURN_TLS_PORT
COTURN_AGENT_PORT=$COTURN_AGENT_PORT
COTURN_MIN_PORT=$COTURN_MIN_PORT
COTURN_MAX_PORT=$COTURN_MAX_PORT
COTURN_SECRET=$COTURN_SECRET
COTURN_AUTH_SECRET=$COTURN_AUTH_SECRET

# Web Configuration
HTTP_PORT=$HTTP_PORT
HTTPS_PORT=$HTTPS_PORT

# Monitoring Configuration
PROMETHEUS_PORT=$PROMETHEUS_PORT
GRAFANA_PORT=$GRAFANA_PORT

# Security Configuration
ENCRYPTION_KEY=$ENCRYPTION_KEY
SESSION_SECRET=$SESSION_SECRET
ADMIN_PASSWORD=$ADMIN_PASSWORD
API_KEY=$API_KEY
EOF

    log_success "✅ .env file created"
}

create_docker_compose() {
    log_step "📝 Creating docker-compose.yml..."
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: \${PROJECT_NAME:-coturn-cluster}_postgres
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-coturn_cluster}
      POSTGRES_USER: \${POSTGRES_USER:-coturn_admin}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256 --auth-local=scram-sha-256"
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    volumes: 
      - postgres_data:/var/lib/postgresql/data
      - ./admin/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - coturn-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-coturn_admin} -d \${POSTGRES_DB:-coturn_cluster}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: \${PROJECT_NAME:-coturn-cluster}_redis
    command: redis-server --requirepass \${REDIS_PASSWORD}
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - coturn-net
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  admin:
    build: 
      context: ./admin
      dockerfile: Dockerfile
    container_name: \${PROJECT_NAME:-coturn-cluster}_admin
    ports:
      - "\${ADMIN_DASHBOARD_PORT:-3000}:3000"
      - "\${ADMIN_API_PORT:-8081}:8081"
      - "\${ADMIN_PUBSUB_PORT:-9001}:9001"
    environment:
      - NODE_ENV=\${NODE_ENV:-development}
      - ADMIN_PUBSUB_PORT=\${ADMIN_PUBSUB_PORT:-9001}
      - ADMIN_API_PORT=\${ADMIN_API_PORT:-8081}
      - ADMIN_DASHBOARD_PORT=\${ADMIN_DASHBOARD_PORT:-3000}
      - POSTGRES_HOST=\${POSTGRES_HOST:-postgres}
      - POSTGRES_PORT=\${POSTGRES_PORT:-5432}
      - POSTGRES_DB=\${POSTGRES_DB:-coturn_cluster}
      - POSTGRES_USER=\${POSTGRES_USER:-coturn_admin}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_SSL=\${POSTGRES_SSL:-false}
      - POSTGRES_POOL_MIN=\${POSTGRES_POOL_MIN:-2}
      - POSTGRES_POOL_MAX=\${POSTGRES_POOL_MAX:-10}
      - REDIS_HOST=\${REDIS_HOST:-redis}
      - REDIS_PORT=\${REDIS_PORT:-6379}
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
      - JWT_SECRET=\${JWT_SECRET}
      - CORS_ORIGIN=\${CORS_ORIGIN:-*}
      - LOG_LEVEL=\${LOG_LEVEL:-info}
    volumes:
      - ./shared:/app/shared:ro
    networks:
      - coturn-net
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  coturn-node:
    build:
      context: ./coturn-node
      dockerfile: Dockerfile
    ports:
      - "\${COTURN_PORT:-3478}:\${COTURN_PORT:-3478}/udp"
      - "\${COTURN_TLS_PORT:-5349}:\${COTURN_TLS_PORT:-5349}/tcp"
      - "\${COTURN_AGENT_PORT:-8082}:\${COTURN_AGENT_PORT:-8082}"
    environment:
      - NODE_ENV=\${NODE_ENV:-development}
      - ADMIN_PUBSUB_URL=ws://admin:\${ADMIN_PUBSUB_PORT:-9001}
      - NODE_ID=coturn-node-1
      - COTURN_AGENT_PORT=\${COTURN_AGENT_PORT:-8082}
      - COTURN_PORT=\${COTURN_PORT:-3478}
      - COTURN_TLS_PORT=\${COTURN_TLS_PORT:-5349}
      - COTURN_MIN_PORT=\${COTURN_MIN_PORT:-49152}
      - COTURN_MAX_PORT=\${COTURN_MAX_PORT:-65535}
      - COTURN_REALM=\${COTURN_REALM:-example.com}
      - COTURN_SECRET=\${COTURN_SECRET}
    volumes:
      - ./shared:/app/shared:ro
      - coturn_config:/etc/turnserver
      - coturn_logs:/var/log/coturn
    networks:
      - coturn-net
    depends_on:
      - admin
      - postgres
    restart: unless-stopped

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: \${PROJECT_NAME:-coturn-cluster}_nginx
    ports:
      - "\${HTTP_PORT:-80}:80"
      - "\${HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/ssl/nginx
    networks:
      - coturn-net
    depends_on:
      - admin
      - coturn-node
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: \${PROJECT_NAME:-coturn-cluster}_prometheus
    ports:
      - "\${PROMETHEUS_PORT:-9090}:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - coturn-net
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: \${PROJECT_NAME:-coturn-cluster}_grafana
    ports:
      - "\${GRAFANA_PORT:-3000}:3000"
    volumes:
      - ./monitoring/coturn-dashboard.json:/etc/grafana/provisioning/dashboards/coturn.json
      - grafana_data:/var/lib/grafana
    networks:
      - coturn-net
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  coturn_config:
  coturn_logs:
  prometheus_data:
  grafana_data:

networks:
  coturn-net:
    driver: bridge
EOF

    log_success "✅ docker-compose.yml created"
}

# ========================================
# DATABASE FUNCTIONS
# ========================================

create_database_init() {
    log_step "📝 Creating database schema..."
    
    mkdir -p admin/database
    
    cat > admin/database/init.sql << 'EOF'
-- Coturn Cluster Database Schema
-- Auto-generated by setup script

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    realm VARCHAR(100) NOT NULL,
    quota_mb INTEGER DEFAULT NULL,
    bandwidth_bps BIGINT DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Node registry table  
CREATE TABLE nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    ip_address INET NOT NULL,
    turn_port INTEGER NOT NULL,
    turns_port INTEGER NOT NULL,
    agent_port INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'connected',
    version VARCHAR(20),
    agent_version VARCHAR(20),
    capabilities TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '{}',
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Node sync tracking
CREATE TABLE user_node_sync (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    node_id VARCHAR(100) REFERENCES nodes(node_id) ON DELETE CASCADE,
    sync_status VARCHAR(20) DEFAULT 'pending',
    synced_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT DEFAULT NULL,
    operation VARCHAR(20) NOT NULL
);

-- Configuration table
CREATE TABLE cluster_config (
    id SERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    applied_to_nodes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(config_type, config_key)
);

-- Audit log table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(100) DEFAULT 'system',
    performed_at TIMESTAMP DEFAULT NOW(),
    source_ip INET,
    user_agent TEXT
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_realm ON users(realm);
CREATE INDEX idx_nodes_node_id ON nodes(node_id);
CREATE INDEX idx_nodes_status ON nodes(status);
CREATE INDEX idx_user_node_sync_user_id ON user_node_sync(user_id);
CREATE INDEX idx_cluster_config_type ON cluster_config(config_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Default configuration
INSERT INTO cluster_config (config_type, config_key, config_value) VALUES
('global', 'max-bps', '1000000'),
('global', 'total-quota', '100'),
('network', 'min-port', '49152'),
('network', 'max-port', '65535'),
('auth', 'use-auth-secret', 'true'),
('limits', 'user-quota', '50'),
('logging', 'log-level', 'info');

-- Default users
INSERT INTO users (username, password, realm) VALUES
('admin', 'admin123', 'admin.local'),
('testuser', 'testpass', 'example.com');

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

    log_success "✅ Database schema created"
}

# ========================================
# MONITORING FUNCTIONS
# ========================================

create_monitoring_config() {
    log_step "📝 Creating monitoring configuration..."
    
    mkdir -p monitoring
    
    # Prometheus config
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'coturn-admin'
    static_configs:
      - targets: ['admin:8081']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'coturn-nodes'
    static_configs:
      - targets: ['coturn-node:8082']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF

    # Grafana dashboard
    cat > monitoring/coturn-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Coturn Cluster Dashboard",
    "tags": ["coturn", "cluster"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Nodes",
        "type": "stat",
        "targets": [
          {
            "expr": "coturn_nodes_total",
            "refId": "A"
          }
        ]
      },
      {
        "id": 2,
        "title": "Total Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(coturn_connections_active)",
            "refId": "B"
          }
        ]
      },
      {
        "id": 3,
        "title": "Bandwidth Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(coturn_bandwidth_bytes_total[5m])",
            "refId": "C"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
EOF

    log_success "✅ Monitoring configuration created"
}

# ========================================
# STARTUP SCRIPTS
# ========================================

create_startup_scripts() {
    log_step "📝 Creating startup scripts..."
    
    mkdir -p scripts
    
    # Development startup script
    cat > scripts/dev-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Coturn Cluster Development Environment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "❌ .env file not found. Run setup script first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database first
echo "🐘 Starting PostgreSQL..."
docker-compose up postgres -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
until docker-compose exec postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    sleep 2
done

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Show status
echo "✅ Services started!"
echo "📊 Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
echo "🔌 API: http://localhost:$ADMIN_API_PORT"
echo "📡 Pub/Sub: ws://localhost:$ADMIN_PUBSUB_PORT"
echo "🐘 PostgreSQL: localhost:$POSTGRES_PORT"

# Follow logs
docker-compose logs -f
EOF

    # Production startup script
    cat > scripts/prod-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Coturn Cluster Production Environment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "❌ .env file not found."
    exit 1
fi

# Build and start services
echo "🔨 Building images..."
docker-compose build

echo "🚀 Starting production services..."
docker-compose up -d

# Health check
echo "🏥 Running health checks..."
sleep 10

if curl -f http://localhost:$ADMIN_API_PORT/health > /dev/null 2>&1; then
    echo "✅ Services are healthy!"
    echo "📊 Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
    echo "🔌 API: http://localhost:$ADMIN_API_PORT"
else
    echo "❌ Health check failed!"
    docker-compose logs
    exit 1
fi
EOF

    # Stop script
    cat > scripts/stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Coturn Cluster..."

docker-compose down

echo "✅ All services stopped"
EOF

    # Multi-node startup script
    cat > scripts/start-multiple-nodes.sh << 'EOF'
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
EOF

    # Backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "💾 Creating backup in $BACKUP_DIR..."

# Backup database
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_DIR/database.sql

# Backup configuration
cp .env $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/

# Backup volumes
docker run --rm -v coturn-cluster_postgres_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

echo "✅ Backup completed: $BACKUP_DIR"
EOF

    # Make scripts executable
    chmod +x scripts/*.sh
    
    log_success "✅ Startup scripts created"
}

# ========================================
# MAIN EXECUTION
# ========================================

main() {
    log_info "🚀 Starting Coturn Cluster setup..."
    
    # Check prerequisites
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v openssl >/dev/null 2>&1 || { log_error "OpenSSL is required but not installed. Aborting."; exit 1; }
    
    # Generate dynamic configuration
    assign_ports
    generate_passwords
    
    # Create all configuration files
    create_env_file
    create_docker_compose
    create_database_init
    create_monitoring_config
    create_startup_scripts
    
    # Create additional directories
    mkdir -p {admin/src/{api,database,services,config},admin/public,admin/database}
    mkdir -p {coturn-node/src,coturn-node/config}
    mkdir -p {shared/src,shared/lib}
    mkdir -p {nginx/conf,nginx/ssl}
    mkdir -p {logs,backups}
    
    # Set permissions
    chmod +x scripts/*.sh
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 SETUP COMPLETE!                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_success "✅ All configuration files created successfully!"
    echo ""
    log_info "📋 Configuration Summary:"
    echo "   • Admin Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
    echo "   • Admin API: http://localhost:$ADMIN_API_PORT"
    echo "   • WebSocket Pub/Sub: ws://localhost:$ADMIN_PUBSUB_PORT"
    echo "   • PostgreSQL: localhost:$POSTGRES_PORT"
    echo "   • Coturn TURN: localhost:$COTURN_PORT"
    echo "   • Coturn Agent: localhost:$COTURN_AGENT_PORT"
    echo ""
    log_info "🔑 Generated Credentials:"
    echo "   • Admin Password: $ADMIN_PASSWORD"
    echo "   • Database Password: [Generated - check .env file]"
    echo "   • API Key: $API_KEY"
    echo ""
    log_info "🚀 Next Steps:"
    echo "   1. Install dependencies: cd admin && npm install"
    echo "   2. Start development: ./scripts/dev-start.sh"
    echo "   3. Start production: ./scripts/prod-start.sh"
    echo "   4. Multiple nodes: ./scripts/start-multiple-nodes.sh 5"
    echo ""
    log_warn "⚠️  Security Notice:"
    echo "   • Change default passwords in production"
    echo "   • Review .env file for sensitive data"
    echo "   • Enable SSL/TLS for production deployment"
    echo ""
    echo -e "${CYAN}📖 Documentation: https://github.com/your-repo/coturn-cluster${NC}"
    echo -e "${CYAN}🐛 Issues: https://github.com/your-repo/coturn-cluster/issues${NC}"
}

# ========================================
# SCRIPT EXECUTION
# ========================================

case "${1:-}" in
    "start")
        log_step "🚀 Starting Coturn Cluster..."
        docker-compose up -d
        ;;
    "stop")
        log_step "🛑 Stopping Coturn Cluster..."
        docker-compose down
        ;;
    "restart")
        log_step "🔄 Restarting Coturn Cluster..."
        docker-compose down
        docker-compose up -d
        ;;
    "logs")
        log_step "📋 Showing logs..."
        docker-compose logs -f
        ;;
    "status")
        log_step "📊 Checking status..."
        docker-compose ps
        ;;
    *)
        main
        ;;
esac