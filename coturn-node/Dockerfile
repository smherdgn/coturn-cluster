FROM node:18-alpine

# Install coturn
RUN apk add --no-cache coturn

WORKDIR /app

# Copy shared library first
COPY shared/ ./shared/

# Copy coturn-node package files
COPY coturn-node/package*.json ./
COPY coturn-node/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy coturn-node source
COPY coturn-node/src/ ./src/
COPY coturn-node/config/ ./config/
COPY coturn-node/coturn-config/ ./coturn-config/

# Build
RUN npm run build

EXPOSE 8100 3478 5349

CMD ["npm", "start"]
