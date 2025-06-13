FROM node:18-alpine

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

WORKDIR /app

COPY ../../package.json ../../yarn.lock ../../pnpm-lock.yaml* ../../tsconfig.base.json ./
COPY ../../packages ./packages
COPY ../../apps ./apps

WORKDIR /app/apps/coturn-node

RUN yarn install --immutable

CMD ["yarn", "dev"]
