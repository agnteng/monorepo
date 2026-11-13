# agnteng.com: the static site, served by nginx.
# Build context: the repository root; Dockerfile: apps/site/Dockerfile.
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/site/package.json apps/site/
COPY apps/branding/package.json apps/branding/
COPY packages/brand/package.json packages/brand/
RUN pnpm install --frozen-lockfile --filter site...
COPY . .
RUN pnpm --filter site build

FROM nginx:alpine
COPY apps/site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/site/dist /usr/share/nginx/html
# COPY keeps the working tree's file modes; nginx must be able to read everything.
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
