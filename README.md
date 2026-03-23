# public-service-stack

Nx monorepo for the administrative procedures platform — a machine-readable, standards-based system for delivering public services to citizens.

## Structure

```
apps/
  procedures-api      # Manages the procedure catalog (CRUD, versioning, publication)
  case-api            # Handles citizen case submission and lifecycle
  wbb-service         # GovStack Workflow Building Block service layer
  portal              # Citizen-facing web portal (Next.js)

libs/
  schemas             # Shared JSON schema types, re-exports @dimbi23/administrative-process-schema
  dto                 # Request/response shapes for API boundaries
  events              # Async event payloads for inter-service communication
```

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- `GITHUB_TOKEN` env var with `read:packages` scope (for `@dimbi23` GitHub Packages)

## Getting started

```sh
# Install dependencies
pnpm install

# Serve an app in development
pnpm exec nx serve procedures-api

# Build all affected projects
pnpm exec nx affected -t build

# Lint all affected projects
pnpm exec nx affected -t lint

# Visualize the project graph
pnpm exec nx graph
```

## Schema standard

Procedure definitions conform to [`@dimbi23/administrative-process-schema`](https://github.com/dimbi23/administrative-process-schema), the normative JSON schema package for Malagasy administrative procedures (BR-001–BR-013).

## CI

GitHub Actions runs lint, build, and test on every push and pull request using `nx affected` — only projects impacted by the diff are processed.
