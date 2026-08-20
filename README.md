# CloudBoard

A production-grade team collaboration platform with Kanban boards, built with modern engineering practices.

> **Status:** Active development. Sprints 1-3 complete. Sprint 4 (deployment) in progress.

---

## Features

**Authentication**

- Email/password registration with automatic personal workspace
- JWT access tokens (15-minute lifespan, HS256)
- Refresh token rotation with SHA-256 hashing
- HttpOnly, SameSite=Strict cookies for session security
- Silent refresh on page load (no localStorage)
- Email enumeration defense on login

**Organizations**

- Multi-tenant workspaces
- Role-based membership: Owner, Admin, Member, Viewer
- Invitation system with role assignment
- Last-owner protection on member removal
- URL-friendly slug generation

**Kanban Boards**

- Create boards with name and description
- Archive boards before permanent deletion (safety pattern)
- Columns with fractional indexing for drag-and-drop ordering
- Tasks with title, description, priority, due date, and assignee
- Cross-column task moves with position recalculation
- Column deletion blocked when tasks exist

**Comments**

- Threaded comments on tasks
- Author-only edit rule (admins cannot edit others' comments)
- Author or admin delete rule (moderation support)
- Edit timestamp tracking

**Activity Feed**

- Automatic audit trail for task and comment actions
- Fail-silent logging (never blocks user actions)
- Denormalized actor names (survive user deletion)
- Entity snapshots preserved before deletion
- VIEWER role sees activity feed but not deleted content snapshots
- Auto-refresh every 30 seconds
- Cursor-shaped pagination API

**Frontend**

- Next.js 15 with App Router
- Organization and board list pages
- Visual Kanban board with horizontal column layout
- Drag-and-drop for tasks between columns (@dnd-kit)
- Inline create forms for boards, columns, and tasks
- Task detail modal with comment thread
- Activity feed sidebar
- Three-state UI (loading, error, empty) on every page
- Silent refresh preserving sessions across page reloads

---

## Technology Stack

**Frontend**

- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS
- TanStack Query (server state with smart caching)
- React Hook Form + Zod (form validation)
- @dnd-kit (drag-and-drop)

**Backend**

- Node.js 22 with Express 5
- TypeScript (strict mode)
- Zod (runtime validation)
- bcrypt (password hashing, cost factor 12)
- jsonwebtoken (JWT signing, HS256)
- fractional-indexing (drag-and-drop ordering)

**Database**

- PostgreSQL 16
- Prisma 6 ORM with migrations

**Infrastructure**

- Docker with multi-stage production builds
- Docker Compose for local development
- npm workspaces for monorepo management

**Code Quality**

- ESLint with strict TypeScript rules
- Prettier for consistent formatting
- Husky + lint-staged for pre-commit hooks
- Commitlint for Conventional Commits
- Vitest for unit testing (18 tests)

---

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop with Docker Compose v2
- Git 2.x

---

## Quick Start

git clone https://github.com/oladapo-elegbede/cloudboard.git
cd cloudboard
npm install

text

Copy the API environment file:
cp apps/api/.env.example apps/api/.env

text

Start Docker services (API + PostgreSQL):
docker compose up -d

text

Run database migrations:
cd apps/api
npx prisma migrate dev
cd ../..

text

Start the frontend:
cd apps/web
npm run dev

text

Open your browser:

- Frontend: http://localhost:3001
- API health: http://localhost:3000/health
- API database health: http://localhost:3000/health/db

---

## Project Structure

cloudboard/
apps/
api/ Backend Express application
prisma/ Database schema and migrations
src/
config/ Environment validation (Zod)
infrastructure/ Database client (Prisma singleton)
modules/
auth/ Authentication (JWT, bcrypt, refresh tokens)
users/ User management and profile
organizations/ Multi-tenant workspaces and memberships
boards/ Kanban boards with archive workflow
columns/ Board columns with fractional indexing
tasks/ Tasks with cross-column moves
comments/ Task comments with author permissions
activities/ Activity audit trail
web/ Frontend Next.js application
src/
app/ App Router pages
login/ Login page
register/ Registration page
organizations/[orgId]/ Organization detail with board list
boards/[boardId]/ Board detail with Kanban view
components/ Reusable UI components
contexts/ Auth and Query providers
lib/ API client modules
.husky/ Git hooks
docker-compose.yml Local development orchestration

text

---

## API Endpoints

**Authentication**

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout

**Users**

- GET /api/v1/users/me

**Organizations**

- POST /api/v1/organizations
- GET /api/v1/organizations
- GET /api/v1/organizations/:id
- GET /api/v1/organizations/:id/members
- POST /api/v1/organizations/:id/members
- DELETE /api/v1/organizations/:id/members/:userId

**Boards**

- POST /api/v1/organizations/:id/boards
- GET /api/v1/organizations/:id/boards
- GET /api/v1/boards/:id
- PATCH /api/v1/boards/:id
- POST /api/v1/boards/:id/archive
- POST /api/v1/boards/:id/restore
- DELETE /api/v1/boards/:id

**Columns**

- POST /api/v1/boards/:id/columns
- GET /api/v1/boards/:id/columns
- PATCH /api/v1/columns/:id
- POST /api/v1/columns/:id/move
- DELETE /api/v1/columns/:id

**Tasks**

- POST /api/v1/columns/:id/tasks
- GET /api/v1/columns/:id/tasks
- GET /api/v1/boards/:id/tasks
- GET /api/v1/tasks/:id
- PATCH /api/v1/tasks/:id
- POST /api/v1/tasks/:id/move
- DELETE /api/v1/tasks/:id

**Comments**

- POST /api/v1/tasks/:id/comments
- GET /api/v1/tasks/:id/comments
- PATCH /api/v1/comments/:id
- DELETE /api/v1/comments/:id

**Activities**

- GET /api/v1/boards/:id/activities

**Health**

- GET /health
- GET /health/db

---

## Available Commands

**Monorepo root:**

- npm run lint
- npm run lint:fix
- npm run format
- npm run format:check

**Backend (apps/api):**

- npm run dev (development with hot reload)
- npm run build (compile TypeScript)
- npm run start (run compiled production build)
- npm run typecheck (verify types)
- npm run test (run unit tests)
- npm run test:watch (watch mode)

**Frontend (apps/web):**

- npm run dev (Next.js dev server)
- npm run build (production build)

**Docker:**

- docker compose up -d (start all services)
- docker compose ps (list services)
- docker compose down (stop services)
- docker compose logs -f api (stream API logs)

**Production Docker:**

- docker build -f apps/api/Dockerfile --target production -t cloudboard-api:prod .

**Prisma:**

- npx prisma migrate dev (apply migrations)
- npx prisma generate (regenerate client)
- npx prisma studio (visual database browser)

---

## Architecture

CloudBoard follows a modular monolith architecture. Every request flows through:
Router -> Middleware -> Controller -> Service -> Repository -> Database

text

- Routers define endpoints and apply middleware
- Middleware handles auth, validation, and authorization
- Controllers parse requests and format responses
- Services contain business logic
- Repositories contain database queries

Authorization is enforced via middleware chains:

- requireAuth (JWT verification)
- requireMembership (org membership check)
- requireRole (role hierarchy: Owner > Admin > Member > Viewer)
- requireBoardAccess / requireColumnAccess / requireTaskAccess / requireCommentAccess

Every API response follows a consistent envelope:
Success: { "success": true, "data": { ... } }
Error: { "success": false, "error": { "code": "...", "message": "..." } }

text

---

## Development Workflow

- Branch naming: {type}/{ticket-id}-{description}
- Commit format: Conventional Commits (enforced by commitlint)
- Pre-commit: ESLint + Prettier via husky + lint-staged
- All changes go through pull requests
- Main branch is protected

---

## Sprint Progress

**Sprint 1 â€” Foundation (COMPLETE)**
Repository setup, backend scaffold, Docker, Prisma, ESLint, Prettier, Husky, Next.js frontend

**Sprint 2 â€” Authentication (COMPLETE)**
User model, JWT tokens, registration, login, refresh, logout, middleware, frontend auth UI, organizations, memberships, role-based access control

**Sprint 3 â€” Kanban Features (COMPLETE)**
Boards, columns, tasks with fractional indexing, drag-and-drop, comments, activity logging, full frontend Kanban UI

**Sprint 4 â€” Deployment (IN PROGRESS)**
Production Dockerfile, unit testing, CI/CD, documentation

---

## License

Private project. No license granted for reuse at this time.

---

## Deployment & Infrastructure

CloudBoard is designed for zero-downtime deployment on AWS using ECS Fargate, RDS PostgreSQL, and ALB.

Complete infrastructure code is defined using AWS CDK in `infrastructure/stack.ts`.

- **Deployment Guide:** See [docs/deployment.md](./docs/deployment.md) for step-by-step deployment instructions.
- **Cost Estimation:** See [docs/cost-estimation.md](./docs/cost-estimation.md) for monthly AWS cost breakdown.

---

## Final Project Status

All four development sprints complete:

- ✅ **Sprint 1 — Foundation** (Monorepo, Express, Docker, Prisma, Next.js, Quality tooling)
- ✅ **Sprint 2 — Authentication & Authorization** (JWT rotation, bcrypt, multi-tenancy, RBAC, frontend auth)
- ✅ **Sprint 3 — Kanban Features** (Boards, columns, tasks, drag-and-drop, comments, activity logging)
- ✅ **Sprint 4 — Deployment & Production** (Multi-stage Docker, unit tests, CI/CD pipeline, OpenAPI docs, AWS CDK)
