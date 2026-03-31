# Railway PoC Deployment (Monorepo)

This guide automates most of a full-system Railway deployment for:

- portal (Next.js + Payload)
- case-api (NestJS + Prisma/Postgres)
- procedures-api (NestJS)
- wbb-service (NestJS + Redis)

It also provisions:

- 2x Postgres (portal + case-api)
- 1x Redis (shared for portal + wbb-service)

## Prerequisites

- Railway CLI installed (`railway --version`)
- Logged in: `railway login`
- Repo access from Railway

## 1) Create Project + Services (CLI)

From the repo root:

```bash
./railway/deploy.sh
```

The script creates the project, services, and databases. It will prompt where the CLI requires interaction (Railway CLI is interactive for some steps).

## 2) Set Secrets + URLs

After the services are created, set env vars.

### Portal

- `DATABASE_URL` -> Postgres (portal)
- `PAYLOAD_SECRET` -> random 32+ chars
- `REDIS_URL` -> Redis
- `CASE_API_URL` -> Railway URL of case-api
- `WBB_SERVICE_URL` -> Railway URL of wbb-service

### Case API

- `DATABASE_URL` -> Postgres (case-api)

### WBB Service

- `REDIS_URL` -> Redis

### Optional

- `GITHUB_TOKEN` -> if using private GitHub packages

## 3) Build + Start Commands (Railway UI)

Because this is a monorepo, set build/start per service in the Railway UI.
You can also copy the provided templates:

- `railway/railway.portal.toml`
- `railway/railway.case-api.toml`
- `railway/railway.procedures-api.toml`
- `railway/railway.wbb-service.toml`

Rename the one you need to `railway.toml` in the repo root before deploying that service.

### portal

- Build: `pnpm install --frozen-lockfile && pnpm exec nx build @org/portal`
- Start: `pnpm exec nx run @org/portal:serve:production`

### case-api

- Build: `pnpm install --frozen-lockfile && pnpm exec nx build @org/case-api`
- Start: `pnpm exec nx run @org/case-api:serve:production`

### procedures-api

- Build: `pnpm install --frozen-lockfile && pnpm exec nx build @org/procedures-api`
- Start: `pnpm exec nx run @org/procedures-api:serve:production`

### wbb-service

- Build: `pnpm install --frozen-lockfile && pnpm exec nx build @org/wbb-service`
- Start: `pnpm exec nx run @org/wbb-service:serve:production`

## 4) Prisma (case-api)

Add a Deploy Command for the case-api service:

```bash
pnpm exec nx run @org/case-api:db:deploy
```

## Notes

- Railway injects `PORT` automatically.
- Use `railway domain` to generate a public URL per service.
