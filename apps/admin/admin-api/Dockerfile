FROM node:18-alpine

RUN apk add --no-cache python3 make g++ \
    && corepack enable && corepack prepare yarn@4.9.2 --activate
WORKDIR /app

COPY package.json yarn.lock pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
COPY turbo.json ./

WORKDIR /app/apps/admin-api

RUN yarn install --immutable && yarn build

EXPOSE 8080
CMD ["node", "dist/server.js"]
