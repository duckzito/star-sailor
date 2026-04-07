# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Copy source
COPY shared/ shared/
COPY client/ client/
COPY server/ server/
COPY tsconfig.base.json ./

# Build client (Vite) and server (esbuild)
RUN npm run build --workspace=shared && \
    npm run build --workspace=client && \
    npm run build --workspace=server

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY server/package.json server/
RUN npm ci --omit=dev --workspace=server --workspace=shared && \
    npm cache clean --force

# Copy built artifacts
COPY --from=build /app/server/dist/ server/dist/
COPY --from=build /app/client/dist/ client/

# Non-root user
RUN addgroup -S sailor && adduser -S sailor -G sailor
USER sailor

ENV NODE_ENV=production
ENV PORT=2567
ENV CLIENT_DIR=/app/client

EXPOSE 2567

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:2567/health || exit 1

CMD ["node", "server/dist/index.js"]
