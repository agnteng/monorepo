# branding.agnteng.com. Build context: the repository root (the workspace
# manifests and content/ live there), Dockerfile: apps/branding/Dockerfile.

# ── build ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
# Manifests first, so the dependency layer is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/branding/package.json apps/branding/
RUN pnpm install --frozen-lockfile
COPY . .
# LUMA_API_KEY is inlined here, from the .env Dokploy writes to the build
# context (astro.config.mjs reads .env from the repository root).
RUN pnpm --filter branding build
# A self-contained copy of the app with production dependencies only: the SSR
# output imports react and astro's runtime rather than bundling them.
RUN pnpm --filter branding deploy --prod /out

# ── run ──────────────────────────────────────────────────────────────────
# Most pages are prerendered above; the deck pages and api/audience.json are
# on-demand, so this is a node process rather than nginx. The node adapter's
# standalone server serves the prerendered output itself.
FROM node:22-alpine
WORKDIR /app
COPY --from=build /out/package.json ./
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/branding/dist ./dist
ENV HOST=0.0.0.0
# Port 80, which the service's existing port mapping expects.
ENV PORT=80
EXPOSE 80
CMD ["node", "./dist/server/entry.mjs"]
