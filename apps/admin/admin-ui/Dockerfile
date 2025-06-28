FROM node:18-alpine

RUN apk add --no-cache python3 make g++ \
    && corepack enable && corepack prepare yarn@4.9.2 --activate

WORKDIR /app

COPY package.json yarn.lock tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
COPY turbo.json ./

WORKDIR /app/apps/admin-ui

RUN yarn install --immutable
RUN yarn build

FROM nginx:1.25-alpine
COPY --from=0 /app/apps/admin-ui/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/admin/admin-ui/nginx.conf /etc/nginx/conf.d
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]