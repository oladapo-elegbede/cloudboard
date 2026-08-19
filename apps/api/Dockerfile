# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Development (used by docker-compose for local dev)
# ==============================================================================
FROM node:22-slim AS dev

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npx prisma generate

EXPOSE 3000

USER node

CMD ["npm", "run", "dev"]

# ==============================================================================
# Stage 2: Builder (compiles TypeScript, prepares production artifacts)
# ==============================================================================
FROM node:22-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --ignore-scripts

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npx prisma generate
RUN npm run build

# ==============================================================================
# Stage 3: Production (minimal runtime image)
# ==============================================================================
FROM node:22-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]