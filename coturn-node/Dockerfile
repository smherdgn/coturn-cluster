FROM ubuntu:22.04

# Install coturn and Node.js
RUN apt-get update && apt-get install -y \
    coturn \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package*.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .
COPY ../shared ../shared

# Build agent
RUN npm run build

# Copy coturn config
COPY config/turnserver.conf /etc/turnserver.conf
COPY scripts/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 3478/udp 5349/tcp 8080

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
