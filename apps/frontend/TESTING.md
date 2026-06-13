# Auth test suite

Layered coverage for login, role routing, admin API auth, and RLS.

## Quick start (unit tests — no Supabase credentials)

```bash
# From repo root
yarn install
yarn test

# Or individually
yarn workspace frontend test
yarn workspace backend test
```

## Backend tests

Uses the project virtualenv:

```bash
cd apps/backend
./venv/Scripts/pip install -r requirements-dev.txt   # Windows
./venv/Scripts/pytest                                 # Windows

# macOS/Linux
venv/bin/pip install -r requirements-dev.txt
venv/bin/pytest
```

## Test layers

| Layer | Location | Command | Credentials |
|-------|----------|---------|-------------|
| Unit (frontend) | `src/**/*.test.ts` | `yarn workspace frontend test` | None |
| Unit (backend) | `apps/backend/tests/` | `yarn workspace backend test` | None |
| RLS integration | `tests/integration/` | `yarn test:integration` | See `.env.test.example` |
| Shared fixtures | `tests/fixtures/` | (imported by unit, E2E, integration tests) | None |
| E2E | `e2e/*.spec.ts` | `yarn test:e2e` | See `.env.test.example` |
| SQL RLS checks | `supabase/tests/rls_bike_policies.sql` | Manual in SQL editor | — |

## Environment variables

Copy `apps/frontend/.env.test.example` to `apps/frontend/.env.test.local` and fill in:

- **E2E_*** — Playwright login flows (skipped when unset)
- **SUPABASE_TEST_*** — Live RLS integration suite (skipped when unset)

Admin test user must have `app_metadata.role = "admin"`. Customer must not.

## E2E

Playwright loads `apps/frontend/.env.local` (and optional `.env.test.local`) automatically via `playwright.config.ts`.

```bash
# Install browsers (first time)
yarn workspace frontend exec playwright install chromium

# Run against running dev server
PLAYWRIGHT_SKIP_WEBSERVER=1 yarn test:e2e

# Or let Playwright start `yarn dev` automatically
yarn test:e2e
```

Route-protection tests in `e2e/auth-routes.spec.ts` run without credentials.

## What is covered

- `utils/auth.ts` — role detection, redirects, display name
- `lib/auth-redirect.ts` — proxy redirect matrix
- `dependencies.verify_admin` — 401/403/admin pass
- `/api/admin/*` — bearer required, customer blocked
- RLS — customer cannot write bikes; admin can (integration)
- E2E — route guards, customer account, admin login
