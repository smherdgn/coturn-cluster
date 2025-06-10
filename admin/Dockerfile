FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package*.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .
COPY ../shared ../shared

# Build
RUN npm run build

EXPOSE 3000 8080 9001

CMD ["npm", "start"]
