# CloudBoard

A production-grade team collaboration platform built with modern engineering practices.

> **Status:** Sprint 1 complete. Foundation shipped. Authentication and features in progress.

---

## Overview

CloudBoard is a modern team collaboration platform inspired by Trello, Jira, and Linear. Teams create workspaces, organize projects into Kanban boards, and collaborate on tasks with comments, attachments, and activity tracking.

This repository is being built incrementally as a production-quality SaaS application.

---

## Technology Stack

**Frontend**

- Next.js 15 with App Router
- React 19
- TypeScript in strict mode
- Tailwind CSS

**Backend**

- Node.js 22 with Express 5
- TypeScript in strict mode
- Zod for runtime validation

**Database**

- PostgreSQL 16
- Prisma 6 ORM with migrations

**Infrastructure**

- Docker and Docker Compose for local development
- npm workspaces for monorepo management

**Code Quality**

- ESLint with strict rules
- Prettier for consistent formatting
- Husky for git hooks
- lint-staged for fast pre-commit checks
- Commitlint for Conventional Commits

---

## Prerequisites

Before you begin, ensure you have installed:

- Node.js version 20 or higher
- npm version 10 or higher
- Docker Desktop with Docker Compose v2
- Git version 2.x

---

## Quick Start

Clone the repository and install:
git clone https://github.com/oladapo-elegbede/cloudboard.git
cd cloudboard
npm install

text

Copy the environment example file for the API:
cp apps/api/.env.example apps/api/.env

text

Start the Docker services (API and PostgreSQL):
docker compose up -d

text

Start the frontend:
cd apps/web
npm run dev

text

Open your browser to:

- Frontend: http://localhost:3001
- API health check: http://localhost:3000/health
- API database check: http://localhost:3000/health/db

---

## Project Structure

cloudboard/
apps/
api/ Backend Express application
web/ Frontend Next.js application
packages/ Shared libraries (future)
.husky/ Git hooks
docker-compose.yml Local orchestration

text

---

## Available Commands

**From the monorepo root:**

- npm run lint — check all files for ESLint errors
- npm run format — format all files with Prettier
- npm run format:check — verify formatting

**From apps/api:**

- npm run dev — start API with hot reload
- npm run build — compile TypeScript
- npm run typecheck — verify types

**From apps/web:**

- npm run dev — start Next.js on port 3001
- npm run build — production build

**Docker Compose:**

- docker compose up -d — start all services
- docker compose ps — list services
- docker compose down — stop and remove containers

**Prisma (from apps/api):**

- npx prisma migrate dev — apply migrations
- npx prisma generate — regenerate client
- npx prisma studio — visual database browser

---

## Environment Variables

All variables are validated at startup using Zod. Missing or invalid variables cause immediate exit with a clear error.

**API variables (apps/api/.env):**

- NODE_ENV — development, production, or test
- PORT — HTTP server port (1-65535)
- DATABASE_URL — PostgreSQL connection string
- ALLOWED_ORIGINS — comma-separated allowed frontend origins for CORS

See apps/api/.env.example for the complete list.

---

## Architecture

CloudBoard uses a modular monolith architecture. Every request follows a layered pattern:

Router to Middleware to Controller to Service to Repository to Database

Every API response follows a consistent envelope:

Success:
{ "success": true, "data": {} }

text

Error:
{ "success": false, "error": { "code": "CODE", "message": "..." } }

text

---

## Development Workflow

CloudBoard follows GitHub Flow with mandatory pull requests.

Branch naming: {type}/{ticket-id}-{short-description}

Examples:

- feature/CB-12-user-authentication
- fix/CB-34-refresh-token-expiry

Commit messages follow Conventional Commits: {type}(scope): {description}

Every commit passes through pre-commit and commit-msg hooks.

---

## Sprint Progress

**Sprint 1 - Foundation (COMPLETE)**

- Monorepo setup
- Express backend with TypeScript
- Environment variable validation
- ESLint and Prettier
- Git hooks with Husky, lint-staged, commitlint
- Docker and Docker Compose
- Prisma with PostgreSQL
- Next.js frontend with API integration
- Documentation

**Sprint 2 - Authentication (PLANNED)**

- User model and password hashing
- JWT with refresh token rotation
- Sign up and login endpoints
- Frontend auth UI
- Protected routes
- Organizations and memberships
- Role-based access control

---

## License

Private project. No license granted for reuse at this time.
