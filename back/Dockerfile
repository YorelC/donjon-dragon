# ── Multi-stage Docker build pour back NestJS ──

# Stage 1 : Install dependencies + build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY shared/package.json shared/
COPY back/package.json back/
COPY back/tsconfig.json back/

# Install (frozen lockfile = exact versions)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared/src shared/src
COPY back/src back/src

# Build the back
RUN cd back && npx nest build

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 2 : Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built artifacts + production node_modules
COPY --from=builder /app/back/dist ./back/dist
COPY --from=builder /app/back/node_modules ./back/node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "back/dist/back/src/main.js"]