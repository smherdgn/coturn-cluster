FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/
COPY public/ ./public/
COPY shared-lib/ ./shared/lib/

RUN npm run build

EXPOSE 8080 3000 9000

CMD ["npm", "start"]
