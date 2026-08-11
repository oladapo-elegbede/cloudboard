# syntax=docker/dockerfile:1

FROM node:22-slim

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