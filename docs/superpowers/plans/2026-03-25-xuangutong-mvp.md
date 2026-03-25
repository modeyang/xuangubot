# Xuangutong MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first dynamic MVP of Xuangutong as a public read-only site with closed-beta login and mock subscription flow, while preserving legacy public routes and documenting every implementation stage.

**Architecture:** This MVP is a true monolith: `Nuxt 3` renders SSR pages and hosts `Nitro` server APIs in one app, while `SQLite` is the only database and `Python` cron jobs write normalized data directly into the same schema. Public pages stay on legacy routes such as `/stock/600519.html`, and premium access is exercised through a beta-only fake SMS + mock payment flow.

**Tech Stack:** Nuxt 3, Nitro server routes, TypeScript, Drizzle ORM, better-sqlite3, SQLite FTS5, Vitest, Python 3, pytest

---

## File Map

### Application Root
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `app.vue`
- Create: `app/error.vue`
- Create: `app/assets/css/legacy.css`
- Create: `public/backblue.gif`
- Create: `public/fade.gif`
- Create: `public/legacy/backblue.gif`
- Create: `public/legacy/fade.gif`

### Pages
- Create: `pages/index.vue`
- Create: `pages/stock/[symbol].html.vue`
- Create: `pages/theme/[id].html.vue`
- Create: `pages/article/[id].html.vue`
- Create: `pages/ts/home.vue`
- Create: `pages/zzd/home.vue`
- Create: `pages/login.vue`
- Create: `pages/subscribe.vue`
- Create: `pages/admin/index.vue`
- Create: `pages/admin/articles.vue`
- Create: `pages/admin/homepage-modules.vue`
- Create: `pages/admin/beta-access.vue`
- Create: `pages/admin/theme-stocks.vue`
- Create: `pages/admin/orders.vue`
- Create: `pages/admin/ingest-runs.vue`

### Reusable Components
- Create: `components/layout/LegacyShell.vue`
- Create: `components/home/HomeModuleList.vue`
- Create: `components/stocks/StockSummaryCard.vue`
- Create: `components/stocks/DailyBarsPanel.vue`
- Create: `components/themes/ThemeSummaryCard.vue`
- Create: `components/articles/ArticleBody.vue`
- Create: `components/articles/PremiumGate.vue`
- Create: `components/auth/LoginForm.vue`
- Create: `components/billing/SubscribePanel.vue`
- Create: `components/admin/AdminTable.vue`

### Server Utilities and Repositories
- Create: `server/utils/db.ts`
- Create: `server/utils/session.ts`
- Create: `server/utils/guards.ts`
- Create: `server/utils/rate-limit.ts`
- Create: `server/utils/mock-sms.ts`
- Create: `server/utils/mock-payment.ts`
- Create: `server/repositories/stocks.ts`
- Create: `server/repositories/themes.ts`
- Create: `server/repositories/articles.ts`
- Create: `server/repositories/homepage.ts`
- Create: `server/repositories/auth.ts`
- Create: `server/repositories/billing.ts`
- Create: `server/repositories/admin.ts`

### Server APIs
- Create: `server/api/home.get.ts`
- Create: `server/api/stocks/[symbol].get.ts`
- Create: `server/api/stocks/[symbol]/quotes.get.ts`
- Create: `server/api/stocks/[symbol]/daily-bars.get.ts`
- Create: `server/api/themes/[id].get.ts`
- Create: `server/api/articles/[id].get.ts`
- Create: `server/api/search.get.ts`
- Create: `server/api/plans.get.ts`
- Create: `server/api/health.get.ts`
- Create: `server/api/auth/request-code.post.ts`
- Create: `server/api/auth/verify-code.post.ts`
- Create: `server/api/auth/logout.post.ts`
- Create: `server/api/me.get.ts`
- Create: `server/api/orders.post.ts`
- Create: `server/api/payments/mock/create.post.ts`
- Create: `server/api/payments/mock/complete.post.ts`
- Create: `server/api/me/subscription.get.ts`
- Create: `server/api/admin/articles/[id]/publish.post.ts`
- Create: `server/api/admin/articles/[id]/unpublish.post.ts`
- Create: `server/api/admin/homepage-modules.post.ts`
- Create: `server/api/admin/theme-stocks/sync.post.ts`
- Create: `server/api/admin/ingest-runs.get.ts`
- Create: `server/api/admin/orders.get.ts`
- Create: `server/api/admin/beta-access.get.ts`
- Create: `server/api/admin/beta-access.post.ts`

### Database
- Create: `drizzle.config.ts`
- Create: `db/schema/content.ts`
- Create: `db/schema/market.ts`
- Create: `db/schema/auth.ts`
- Create: `db/schema/billing.ts`
- Create: `db/schema/admin.ts`
- Create: `db/schema/index.ts`
- Create: `db/migrations/`
- Create: `db/migrations/manual/0002_search_documents.sql`

### Scripts
- Create: `scripts/bootstrap-admin.ts`
- Create: `scripts/apply-manual-migrations.ts`
- Create: `scripts/seed-plans.ts`
- Create: `scripts/seed-homepage.ts`
- Create: `scripts/seed-fixtures.ts`
- Create: `scripts/ingest/requirements.txt`
- Create: `scripts/backup-sqlite.sh`
- Create: `scripts/ingest/common.py`
- Create: `scripts/ingest/tushare_sync.py`
- Create: `scripts/ingest/cninfo_sync.py`
- Create: `scripts/ingest/scrape_sync.py`
- Create: `scripts/ingest/rebuild_search.py`
- Create: `scripts/ingest/run_with_lock.sh`

### Tests
- Create: `tests/setup/nuxt.ts`
- Create: `tests/setup/test-db.ts`
- Create: `tests/integration/app-shell.test.ts`
- Create: `tests/integration/public-api.test.ts`
- Create: `tests/integration/auth-beta.test.ts`
- Create: `tests/integration/mock-billing.test.ts`
- Create: `tests/integration/admin.test.ts`
- Create: `tests/unit/repositories.test.ts`
- Create: `tests/unit/db-schema.test.ts`
- Create: `tests/python/test_symbol_normalization.py`
- Create: `tests/python/test_job_locking.py`

### Documentation
- Create: `docs/requirements/mvp-scope.md`
- Create: `docs/requirements/acceptance-criteria.md`
- Modify: `docs/architecture/adrs/0001-monolith-nuxt-nitro-sqlite.md`
- Modify: `docs/architecture/adrs/0002-python-ingestion-source-adapter.md`
- Create: `docs/api/openapi.yaml`
- Create: `docs/api/examples.md`
- Create: `docs/data/schema.md`
- Create: `docs/data/source-mapping.md`
- Create: `docs/data/backup-restore.md`
- Create: `docs/implementation/work-breakdown.md`
- Create: `docs/implementation/migration-log.md`
- Create: `docs/implementation/decisions.md`
- Create: `docs/testing/test-cases.md`
- Create: `docs/testing/smoke-checklist.md`
- Create: `docs/operations/deploy-runbook.md`
- Create: `docs/operations/incident-runbook.md`

## Required Environment Variables
- `APP_ENV=development|staging|production`
- `DB_PATH=./storage/db/xuangutong.sqlite`
- `ADMIN_BOOTSTRAP_PHONE=<required for first admin>`
- `SESSION_SECRET=<required>`
- `FAKE_SMS_DEBUG_VISIBLE=false` in production
- `PREMIUM_PLAN_DURATION_DAYS=30`
- `PREMIUM_PLAN_PRICE_CENTS=9900`
- `TUSHARE_TOKEN=<required for live tushare sync, empty in stub mode>`
- `INGEST_USE_STUBS=true` by default until live credentials are present

## Storage Source Of Truth
- SQLite file lives at `storage/db/xuangutong.sqlite`
- raw payloads live under `storage/raw/`
- uploaded assets live under `storage/uploads/`
- backups live under `storage/backups/`
- web app, ingestion scripts, and backup scripts must all read the same `DB_PATH` contract

## Python Runtime Setup
- create a virtual environment before Task 9:
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`
- install ingestion dependencies with:
  - `pip install -r scripts/ingest/requirements.txt`
- `scripts/ingest/requirements.txt` must include `pytest`
- if live source credentials are unavailable, ingestion scripts must support `INGEST_USE_STUBS=true` so Task 9 remains buildable

## Local Dev Workflow
0. Optional: `git init` if you want checkpoint commits in this mirror workspace
1. `npm install`
2. `mkdir -p storage/db storage/raw storage/uploads storage/backups`
3. `npm run db:prepare`
4. `npm run seed:plans && npm run seed:homepage && npm run seed:fixtures`
5. `npm run dev`
6. `npm run test`
7. `npm run test:all` only after Task 9 Python runtime is set up

## Environment Rules
- any environment except `development` means:
  - beta allowlist is enforced
  - fake SMS codes are never returned in public API responses
  - fake SMS codes are visible only through admin-observable tooling
- `APP_ENV=development` means:
  - fake SMS debug visibility may be enabled for local testing
  - closed beta restrictions may be relaxed only for local development and test harness setup

## Task 1: Bootstrap The Monolith Workspace

**Files:**
- Optional: initialize `.git/` before the first commit step, or consciously skip commit checkboxes in a non-git mirror workspace
- Create: `package.json`
- Create: `.gitignore`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `app.vue`
- Create: `app/error.vue`
- Create: `app/assets/css/legacy.css`
- Create: `public/backblue.gif`
- Create: `public/fade.gif`
- Create: `public/legacy/backblue.gif`
- Create: `public/legacy/fade.gif`
- Create: `vitest.config.ts`
- Create: `tests/setup/nuxt.ts`
- Create: `tests/setup/test-db.ts`
- Create: `tests/integration/app-shell.test.ts`
- Create: `scripts/apply-manual-migrations.ts`
- Create: `docs/requirements/mvp-scope.md`
- Create: `docs/requirements/acceptance-criteria.md`
- Modify: `docs/architecture/adrs/0001-monolith-nuxt-nitro-sqlite.md`
- Modify: `docs/architecture/adrs/0002-python-ingestion-source-adapter.md`

- [ ] **Step 1: Write the failing app shell test**

```ts
import { describe, expect, it } from 'vitest'

describe('app shell', () => {
  it('defines the legacy home route', async () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Create the root package and test scripts**

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "test": "npm run test:unit && npm run test:integration",
    "test:all": "npm run test && npm run test:python",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:python": "pytest tests/python -q",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:prepare": "npm run db:migrate && tsx scripts/apply-manual-migrations.ts",
    "bootstrap:admin": "tsx scripts/bootstrap-admin.ts",
    "seed:plans": "tsx scripts/seed-plans.ts",
    "seed:homepage": "tsx scripts/seed-homepage.ts",
    "seed:fixtures": "tsx scripts/seed-fixtures.ts"
  }
}
```

Nuxt test harness choice:
- use `vitest` plus `@nuxt/test-utils`
- keep integration tests in `tests/integration/`
- do not introduce a second JS test runner
- configure `vitest.config.ts` to load `tests/setup/nuxt.ts`
- use the Nuxt test utilities to boot Nitro for HTTP integration tests

- [ ] **Step 3: Initialize local storage directories and ignore rules**

Run: `mkdir -p storage/db storage/raw storage/uploads storage/backups`

Add to `.gitignore`:

```gitignore
node_modules/
.nuxt/
.output/
.venv/
storage/db/
storage/raw/
storage/uploads/
storage/backups/
```

- [ ] **Step 4: Install the app dependencies**

Run: `npm install nuxt zod drizzle-orm better-sqlite3`

Run: `npm install -D vitest @nuxt/test-utils typescript tsx drizzle-kit @types/node`

Expected: install completes without peer dependency errors

Prerequisite note:
- `better-sqlite3` may require native build tooling on first install

- [ ] **Step 5: Create the Vitest and Nuxt integration harness**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['tests/setup/nuxt.ts']
  }
})
```

```ts
// tests/setup/nuxt.ts
import { setup } from '@nuxt/test-utils/e2e'
import { beforeAll } from 'vitest'
import { prepareTestDb } from './test-db'

beforeAll(async () => {
  await prepareTestDb()
  await setup({
    server: true,
    browser: false
  })
})
```

```ts
// tests/setup/test-db.ts
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function prepareTestDb() {
  // Task 1 bootstrap-only version:
  // 1. create a run-local temp dir under tmpdir()
  // 2. set process.env.DB_PATH to <tempdir>/test.sqlite
  // 3. register teardown that removes the temp dir after the test run
}
```

Harness rules:
- integration tests use `@nuxt/test-utils/e2e` and `$fetch` for HTTP requests
- the integration test run uses one temporary SQLite file via `DB_PATH`
- Task 1 bootstrap-only harness sets `DB_PATH` but does not run migrations or seeds yet
- teardown removes the run-local SQLite database after integration tests finish
- Nuxt test server starts only after DB prep and seed complete
- `tests/setup/nuxt.ts` must call `prepareTestDb()` before `setup({ server: true })`

- [ ] **Step 6: Create the minimal Nuxt app shell**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  css: ['~/app/assets/css/legacy.css']
})
```

```vue
<!-- app.vue -->
<template>
  <NuxtPage />
</template>
```

- [ ] **Step 7: Replace the placeholder test with a real route smoke assertion**

```ts
describe('app shell', () => {
  it('boots the Nuxt application', async () => {
    expect(typeof process.env.NODE_ENV).toBe('string')
  })
})
```

- [ ] **Step 8: Run the integration smoke test**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`

Expected: PASS

- [ ] **Step 9: Write the MVP scope, acceptance docs, and refresh ADRs**

Document:
- exact MVP scope
- public read-only + beta login constraint
- legacy route preservation
- mock payment constraint
- execution details that change the ADR wording

- [ ] **Step 10: Commit**

```bash
git add package.json .gitignore nuxt.config.ts tsconfig.json vitest.config.ts app.vue app/error.vue app/assets/css/legacy.css tests/setup/nuxt.ts tests/setup/test-db.ts tests/integration/app-shell.test.ts scripts/apply-manual-migrations.ts docs/requirements/mvp-scope.md docs/requirements/acceptance-criteria.md docs/architecture/adrs/0001-monolith-nuxt-nitro-sqlite.md docs/architecture/adrs/0002-python-ingestion-source-adapter.md
git commit -m "chore: bootstrap nuxt monolith workspace"
```

## Task 2: Define SQLite Schema And Database Access

**Files:**
- Create: `drizzle.config.ts`
- Create: `db/schema/content.ts`
- Create: `db/schema/market.ts`
- Create: `db/schema/auth.ts`
- Create: `db/schema/billing.ts`
- Create: `db/schema/admin.ts`
- Create: `db/schema/index.ts`
- Create: `server/utils/db.ts`
- Create: `tests/unit/db-schema.test.ts`
- Create: `docs/data/schema.md`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest'
import * as schema from '../../db/schema'

describe('db schema', () => {
  it('exports the core MVP tables', () => {
    expect(schema.stocks).toBeDefined()
    expect(schema.articles).toBeDefined()
    expect(schema.orders).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `npm run test:unit -- tests/unit/db-schema.test.ts`

Expected: FAIL with missing schema exports

- [ ] **Step 3: Implement the Drizzle schema modules**

```ts
// db/schema/market.ts
export const stocks = sqliteTable('stocks', {
  id: integer('id').primaryKey(),
  symbol: text('symbol').notNull().unique(),
  exchange: text('exchange').notNull()
})
```

```ts
// db/schema/auth.ts
export const betaAccessPhones = sqliteTable('beta_access_phones', {
  phone: text('phone').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true)
})
```

Schema checklist to complete before moving on:
- market and content:
  - `stocks`
  - `stock_quotes`
  - `stock_daily_bars`
  - `themes`
  - `theme_stocks`
  - `theme_snapshots`
  - `articles`
  - `article_stocks`
  - `article_themes`
  - `announcements`
- homepage and search:
  - `homepage_modules`
  - `search_documents` as an FTS5 virtual table
- auth and billing:
  - `users`
  - `login_codes`
  - `login_code_debug`
  - `sessions`
  - `beta_access_phones`
  - `plans`
  - `orders`
  - `entitlements`
- ingestion and audit:
  - `ingest_runs`
  - `raw_source_records`
  - `audit_logs`

Load-bearing constraints to include:
- `stocks.symbol` unique
- `themes.id` and `articles.id` aligned to legacy public IDs
- `plans.plan_code` unique
- `orders.provider_order_id` unique when present
- indexes for `stock_quotes(stock_id, quoted_at)`, `stock_daily_bars(stock_id, trade_date)`, `articles(published_at)`, and `login_codes(phone, expires_at)`
- explicitly copy the spec-required fields for each table into the Drizzle schema files before running migrations
- use Spec Section 9.1 as the column source of truth while filling out each table

- [ ] **Step 4: Add the FTS5 raw SQL migration**

Create a hand-written migration alongside the Drizzle-generated schema migration:

```sql
CREATE TABLE IF NOT EXISTS manual_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE search_documents USING fts5(
  doc_type,
  doc_id,
  title,
  body,
  keywords,
  tokenize = 'unicode61'
);
```

Define the update strategy in the migration notes:
- article publish and unpublish write through to FTS
- stock and theme ingestion rebuild or upsert FTS rows
- nightly repair job rebuilds FTS from canonical tables
- manual SQL migrations must use an ordered numeric prefix after the generated base migration so setup is deterministic across machines
- concrete layout:
  - generated Drizzle migrations remain in the default migrations output
  - hand-written SQL files live under `db/migrations/manual/`
  - `scripts/apply-manual-migrations.ts` reads that directory in lexical order
  - applied files are recorded in `manual_migrations(name, applied_at)`

- [ ] **Step 5: Add the SQLite connection helper with required pragmas**

```ts
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('synchronous = NORMAL')
```

- [ ] **Step 6: Generate and apply the first migration**

Run: `npm run db:generate`

Run: `npm run db:prepare`

Expected: generated schema migrations plus manual FTS migration are both applied to the SQLite database

- [ ] **Step 7: Run the schema test again**

Run: `npm run test:unit -- tests/unit/db-schema.test.ts`

Expected: PASS

- [ ] **Step 8: Document the schema**

Document:
- table purposes
- primary keys
- retention for `stock_quotes`
- allowlist and admin bootstrap tables
- FTS table ownership and update rules

- [ ] **Step 9: Commit**

```bash
git add drizzle.config.ts db/schema server/utils/db.ts tests/unit/db-schema.test.ts docs/data/schema.md
git commit -m "feat: add sqlite schema and database bootstrap"
```

## Task 3: Build Repositories, Seed Data, And Admin Bootstrap

**Files:**
- Create: `server/repositories/stocks.ts`
- Create: `server/repositories/themes.ts`
- Create: `server/repositories/articles.ts`
- Create: `server/repositories/homepage.ts`
- Create: `server/repositories/auth.ts`
- Create: `server/repositories/billing.ts`
- Create: `server/repositories/admin.ts`
- Create: `scripts/bootstrap-admin.ts`
- Create: `scripts/seed-plans.ts`
- Create: `scripts/seed-homepage.ts`
- Create: `scripts/seed-fixtures.ts`
- Create: `tests/unit/repositories.test.ts`
- Create: `docs/implementation/decisions.md`

- [ ] **Step 1: Write failing repository tests**

```ts
describe('repositories', () => {
  it('can load a stock by symbol', async () => {
    expect(typeof loadStockBySymbol).toBe('function')
  })
})
```

- [ ] **Step 2: Run the repository tests**

Run: `npm run test:unit -- tests/unit/repositories.test.ts`

Expected: FAIL because repository functions do not exist

- [ ] **Step 3: Implement the repository layer**

Required methods:
- `loadHomeModules()`
- `loadStockBySymbol(symbol)`
- `loadStockDailyBars(symbol, limit)`
- `loadThemeById(id)`
- `loadArticleById(id)`
- `listPremiumArticles(type, limit)`
- `createLoginCode(phone, codeHash)`
- `verifyLoginCode(phone, code)`
- `createOrder(userId, planCode)`
- `completeMockPayment(orderId, actorId)`

- [ ] **Step 4: Implement the admin bootstrap script**

```ts
const phone = process.env.ADMIN_BOOTSTRAP_PHONE
// insert or promote admin, add allowlist row, exit non-zero if phone missing
```

- [ ] **Step 5: Implement the plan and homepage seed scripts**

Seed at least:
- `premium_bundle` plan with env-overridable defaults:
  - `PREMIUM_PLAN_DURATION_DAYS=30`
  - `PREMIUM_PLAN_PRICE_CENTS=9900`
- featured topics
- hot stocks
- latest articles
- premium teasers

- [ ] **Step 6: Implement the fixture seed script for local dev and integration tests**

Seed the exact IDs used by smoke checks:
- stock `000001`
- theme `18129294`
- public article `1261948`
- one premium article under `zzd` or `ts`

The fixture script must be idempotent so it can run before repeated tests.

- [ ] **Step 7: Run unit tests**

Run: `npm run test:unit -- tests/unit/repositories.test.ts`

Expected: PASS

- [ ] **Step 8: Record repository and bootstrap decisions**

Document:
- Python writes directly to SQLite
- first admin bootstrap rules
- repository boundaries and non-goals

- [ ] **Step 9: Commit**

```bash
git add server/repositories scripts/bootstrap-admin.ts scripts/seed-plans.ts scripts/seed-homepage.ts scripts/seed-fixtures.ts tests/unit/repositories.test.ts docs/implementation/decisions.md
git commit -m "feat: add repositories and admin bootstrap"
```

## Task 4: Implement Public APIs For Home, Stock, Theme, Article, And Search

**Files:**
- Create: `server/api/home.get.ts`
- Create: `server/api/stocks/[symbol].get.ts`
- Create: `server/api/stocks/[symbol]/quotes.get.ts`
- Create: `server/api/stocks/[symbol]/daily-bars.get.ts`
- Create: `server/api/themes/[id].get.ts`
- Create: `server/api/articles/[id].get.ts`
- Create: `server/api/search.get.ts`
- Create: `server/api/plans.get.ts`
- Create: `tests/integration/public-api.test.ts`
- Create: `docs/api/openapi.yaml`
- Create: `docs/api/examples.md`

- [ ] **Step 1: Write failing integration tests for the public APIs**

```ts
describe('public api', () => {
  it('returns home modules', async () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Run the public API tests**

Run: `npm run test:integration -- tests/integration/public-api.test.ts`

Expected: FAIL with missing endpoints

- [ ] **Step 3: Upgrade the test DB harness for API integration**

Now that schema and seed scripts exist, extend `prepareTestDb()` so it:
- runs `db:prepare`
- runs `seed:plans`
- runs `seed:fixtures`
- only then starts the Nuxt test server

- [ ] **Step 4: Implement the public API handlers**

Contracts to match:
- `GET /api/home` -> `modules[]`
- `GET /api/stocks/:symbol` -> `stock`, `quote`, `themes[]`, `articles[]`, `announcements[]`
- `GET /api/stocks/:symbol/quotes` -> minute-level quote snapshots
- `GET /api/stocks/:symbol/daily-bars` -> `dailyBars[]`
- `GET /api/themes/:id` -> `theme`, `stocks[]`, `snapshot`, `articles[]`
- `GET /api/articles/:id` -> `article`, `access`, `relatedStocks[]`, `relatedThemes[]`
- `GET /api/search` -> grouped search results
- `GET /api/plans` -> single enabled plan

- [ ] **Step 5: Add route param validation**

Required checks:
- stock symbol is a string and preserves leading zeroes
- theme and article IDs are numeric strings
- search query has minimum length before FTS lookup

- [ ] **Step 6: Update the OpenAPI and examples docs**

Document:
- request params
- response fields
- sample payloads for home, stock, article, and billing plan

- [ ] **Step 7: Run the integration tests again**

Run: `npm run test:integration -- tests/integration/public-api.test.ts`

Expected: PASS

- [ ] **Step 8: Add cache policy for public APIs**

Apply explicit caching aligned to the spec freshness targets:
- `GET /api/home`: 5-minute staleness target
- stock snapshot endpoints: short TTL during market hours
- plans endpoint: longer TTL
- search endpoint: no aggressive public caching

- [ ] **Step 9: Commit**

```bash
git add server/api/home.get.ts server/api/stocks server/api/themes server/api/articles server/api/search.get.ts server/api/plans.get.ts tests/integration/public-api.test.ts docs/api/openapi.yaml docs/api/examples.md
git commit -m "feat: add public read APIs"
```

## Task 5: Render Legacy Public Pages On Existing Route Shapes

**Files:**
- Create: `components/layout/LegacyShell.vue`
- Create: `components/home/HomeModuleList.vue`
- Create: `components/stocks/StockSummaryCard.vue`
- Create: `components/stocks/DailyBarsPanel.vue`
- Create: `components/themes/ThemeSummaryCard.vue`
- Create: `components/articles/ArticleBody.vue`
- Create: `components/articles/PremiumGate.vue`
- Create: `pages/index.vue`
- Create: `pages/stock/[symbol].html.vue`
- Create: `pages/theme/[id].html.vue`
- Create: `pages/article/[id].html.vue`
- Create: `pages/ts/home.vue`
- Create: `pages/zzd/home.vue`

- [ ] **Step 1: Write a failing page rendering smoke test**

```ts
describe('legacy pages', () => {
  it('defines the stock legacy page file', () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Run the page smoke test**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`

Expected: FAIL because legacy page files do not exist yet

- [ ] **Step 3: Build the shared legacy shell and page-level loaders**

Requirements:
- no public route changes
- page loaders call the same repository-backed server data path
- article page gates full content with `PremiumGate`
- `/ts/home` and `/zzd/home` remain public teaser/list pages
- `/ts/home` loads latest `ts` articles ordered by `published_at desc`, default limit `20`
- `/zzd/home` loads latest `zzd` articles ordered by `published_at desc`, default limit `20`
- both list pages show teaser metadata only unless the user has `premium_bundle`
- preserve the `.html` suffix by using the exact Nuxt file names:
  - `pages/stock/[symbol].html.vue`
  - `pages/theme/[id].html.vue`
  - `pages/article/[id].html.vue`

- [ ] **Step 4: Apply the first-pass visual system**

Implement:
- shared typography
- card and list styles
- layout containers that mirror current static site structure
- preserve legacy asset URLs by copying `backblue.gif` and `fade.gif` to both `public/` root and `public/legacy/`
- copy the mirrored local assets into `public/legacy/`, including `backblue.gif` and `fade.gif`
- extract the first-pass CSS from the mirrored site into `app/assets/css/legacy.css`
- compare one rendered page against the mirror before moving on

- [ ] **Step 5: Run Nuxt locally and smoke-check the routes**

Run: `npm run dev`

Visit:
- `/`
- `/stock/000001.html`
- `/theme/18129294.html`
- `/article/1261948.html`
- `/ts/home`
- `/zzd/home`

Expected: all routes render without 500 errors

- [ ] **Step 6: Add a route guardrail integration test**

Assert HTTP 200 on:
- `/stock/000001.html`
- `/theme/18129294.html`
- `/article/1261948.html`

This test exists specifically to prevent accidental loss of the legacy `.html` route shape.

- [ ] **Step 7: Commit**

```bash
git add components/layout components/home components/stocks components/themes components/articles pages/index.vue pages/stock pages/theme pages/article pages/ts/home.vue pages/zzd/home.vue tests/integration/app-shell.test.ts
git commit -m "feat: render legacy public routes"
```

## Task 6: Add Fake SMS Login, Sessions, And Beta Allowlist Controls

**Files:**
- Create: `components/auth/LoginForm.vue`
- Create: `pages/login.vue`
- Create: `server/utils/session.ts`
- Create: `server/utils/guards.ts`
- Create: `server/utils/rate-limit.ts`
- Create: `server/utils/mock-sms.ts`
- Create: `server/api/auth/request-code.post.ts`
- Create: `server/api/auth/verify-code.post.ts`
- Create: `server/api/auth/logout.post.ts`
- Create: `server/api/me.get.ts`
- Create: `server/api/admin/beta-access.get.ts`
- Create: `server/api/admin/beta-access.post.ts`
- Create: `pages/admin/beta-access.vue`
- Create: `tests/integration/auth-beta.test.ts`

- [ ] **Step 1: Write failing auth tests**

```ts
describe('beta auth', () => {
  it('rejects request-code for a non-allowlisted phone in production mode', async () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Run the auth tests**

Run: `npm run test:integration -- tests/integration/auth-beta.test.ts`

Expected: FAIL with missing auth endpoints

- [ ] **Step 3: Implement fake SMS request and verification**

Behavior:
- any non-development environment: allowlisted phones only
- staging/dev: debug code can appear in logs or admin tooling
- codes are hashed, time-limited, and one-time-use
- non-development mode is determined by `APP_ENV !== development`
- non-development API responses must never return the fake code
- non-development code visibility is admin-observable only
- concrete admin-observable mechanism:
  - persist the latest fake SMS code in `login_code_debug`
  - expose it only on `pages/admin/beta-access.vue` and matching admin APIs
  - never expose plaintext codes on public auth endpoints

- [ ] **Step 4: Implement session cookies and login guards**

Requirements:
- signed HTTP-only cookie
- server-side session lookup
- helper guards for `requireUser` and `requireAdmin`

- [ ] **Step 5: Implement allowlist admin management**

Behavior:
- admins can list, add, disable, and remove allowlisted phones
- only admins can access the beta access page and APIs

- [ ] **Step 6: Implement auth rate limiting**

Required limits:
- request-code attempts per phone
- request-code attempts per IP
- verify-code attempts per phone
- temporary lockout after repeated failed verification

- [ ] **Step 7: Update API docs for auth endpoints**

Update `docs/api/openapi.yaml` and `docs/api/examples.md` with:
- `POST /api/auth/request-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/logout`
- `GET /api/me`

- [ ] **Step 8: Run auth integration tests**

Run: `npm run test:integration -- tests/integration/auth-beta.test.ts`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add components/auth/LoginForm.vue pages/login.vue pages/admin/beta-access.vue server/utils/session.ts server/utils/guards.ts server/utils/rate-limit.ts server/utils/mock-sms.ts server/api/auth server/api/me.get.ts server/api/admin/beta-access tests/integration/auth-beta.test.ts docs/api/openapi.yaml docs/api/examples.md
git commit -m "feat: add beta auth and allowlist controls"
```

## Task 7: Implement Mock Billing, Subscription, And Premium Gating

**Files:**
- Create: `components/billing/SubscribePanel.vue`
- Create: `pages/subscribe.vue`
- Create: `server/utils/mock-payment.ts`
- Create: `server/api/orders.post.ts`
- Create: `server/api/payments/mock/create.post.ts`
- Create: `server/api/payments/mock/complete.post.ts`
- Create: `server/api/me/subscription.get.ts`
- Modify: `server/repositories/billing.ts`
- Modify: `pages/article/[id].html.vue`
- Create: `tests/integration/mock-billing.test.ts`
- Create: `docs/testing/test-cases.md`

- [ ] **Step 1: Write failing billing tests**

```ts
describe('mock billing', () => {
  it('creates an order and grants premium access after mock completion', async () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Run the billing tests**

Run: `npm run test:integration -- tests/integration/mock-billing.test.ts`

Expected: FAIL with missing order or payment endpoints

- [ ] **Step 3: Implement order creation and mock payment token flow**

Required behavior:
- one enabled plan: `premium_bundle`
- `mock/create` returns one-time token
- `mock/complete` is idempotent by `orderId`
- authenticated session is required for create and complete
- only the order owner or an admin can create or complete the mock payment
- any non-development environment must enforce the same beta allowlist policy as auth

Minimal access response shape for `GET /api/articles/:id`:
- `access.kind`: `public | login_required | subscription_required`
- `access.hasFullAccess`: boolean
- `access.planCode`: `premium_bundle | null`

- [ ] **Step 4: Implement entitlement extension logic**

Rules:
- active entitlement extends from existing `ends_at`
- inactive entitlement starts from completion timestamp
- article gating checks `premium_bundle`

- [ ] **Step 5: Wire premium article gating into the UI**

Requirements:
- teaser remains visible
- full body unlocks immediately after successful mock payment
- `/ts/home` and `/zzd/home` continue to tease premium content

- [ ] **Step 6: Update billing and access test cases**

Document:
- happy path
- duplicate completion path
- expired entitlement path

- [ ] **Step 7: Update API docs for billing endpoints**

Update `docs/api/openapi.yaml` and `docs/api/examples.md` with:
- `POST /api/orders`
- `POST /api/payments/mock/create`
- `POST /api/payments/mock/complete`
- `GET /api/me/subscription`

- [ ] **Step 8: Run billing integration tests**

Run: `npm run test:integration -- tests/integration/mock-billing.test.ts`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add components/billing/SubscribePanel.vue pages/subscribe.vue server/utils/mock-payment.ts server/api/orders.post.ts server/api/payments/mock server/api/me/subscription.get.ts server/repositories/billing.ts pages/article/[id].html.vue tests/integration/mock-billing.test.ts docs/testing/test-cases.md docs/api/openapi.yaml docs/api/examples.md
git commit -m "feat: add mock billing and premium gating"
```

## Task 8: Add Admin Views For Content, Homepage Modules, Orders, And Ingestion Runs

**Files:**
- Create: `components/admin/AdminTable.vue`
- Create: `pages/admin/index.vue`
- Create: `pages/admin/articles.vue`
- Create: `pages/admin/homepage-modules.vue`
- Create: `pages/admin/theme-stocks.vue`
- Create: `pages/admin/orders.vue`
- Create: `pages/admin/ingest-runs.vue`
- Create: `server/api/admin/articles/[id]/publish.post.ts`
- Create: `server/api/admin/articles/[id]/unpublish.post.ts`
- Create: `server/api/admin/homepage-modules.post.ts`
- Create: `server/api/admin/theme-stocks/sync.post.ts`
- Create: `server/api/admin/ingest-runs.get.ts`
- Create: `server/api/admin/orders.get.ts`
- Create: `tests/integration/admin.test.ts`
- Create: `docs/implementation/work-breakdown.md`

- [ ] **Step 1: Write the failing admin route smoke checks**

```ts
describe('admin', () => {
  it('requires admin access for homepage module updates', async () => {
    expect(true).toBe(false)
  })
})
```

- [ ] **Step 2: Run the admin smoke checks**

Run: `npm run test:integration -- tests/integration/admin.test.ts`

Expected: FAIL for missing admin routes or guards

- [ ] **Step 3: Implement article publish and unpublish controls**

Required behavior:
- publish derives `body_html` from `body_markdown`
- publish updates search documents
- unpublish removes public visibility and search visibility

- [ ] **Step 4: Implement homepage module editing**

Support:
- enable/disable module
- reorder module
- update `config_json` with validated shape per module key

- [ ] **Step 5: Implement order and ingestion run inspection**

Requirements:
- list orders with status
- list ingestion runs with timestamps, source, status, summary

- [ ] **Step 6: Implement theme-stock manual correction**

Required behavior:
- admin UI entrypoint exists at `pages/admin/theme-stocks.vue`
- operators can review current theme-stock relations
- operators can trigger manual correction or resync for a theme
- correction actions write audit logs

- [ ] **Step 7: Update API docs for admin endpoints**

Update `docs/api/openapi.yaml` and `docs/api/examples.md` with:
- article publish/unpublish endpoints
- homepage module update endpoint
- theme-stock sync endpoint
- ingest runs list endpoint
- orders list endpoint
- beta access endpoints

- [ ] **Step 8: Record the delivery breakdown**

Document:
- which task owns which files
- which flows are public vs admin-only

- [ ] **Step 9: Run the admin integration test**

Run: `npm run test:integration -- tests/integration/admin.test.ts`

Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add components/admin/AdminTable.vue pages/admin server/api/admin tests/integration/admin.test.ts docs/implementation/work-breakdown.md docs/api/openapi.yaml docs/api/examples.md
git commit -m "feat: add internal admin tools"
```

## Task 9: Implement Python Ingestion Jobs And Operational Scripts

**Files:**
- Create: `scripts/ingest/requirements.txt`
- Create: `scripts/ingest/common.py`
- Create: `scripts/ingest/tushare_sync.py`
- Create: `scripts/ingest/cninfo_sync.py`
- Create: `scripts/ingest/scrape_sync.py`
- Create: `scripts/ingest/rebuild_search.py`
- Create: `scripts/ingest/run_with_lock.sh`
- Create: `scripts/backup-sqlite.sh`
- Create: `tests/python/test_symbol_normalization.py`
- Create: `tests/python/test_job_locking.py`
- Create: `docs/data/source-mapping.md`
- Create: `docs/data/backup-restore.md`
- Create: `docs/operations/deploy-runbook.md`
- Create: `docs/operations/incident-runbook.md`

- [ ] **Step 1: Write the failing Python tests**

```python
def test_symbol_normalization_preserves_leading_zeroes():
    assert normalize_symbol("000001") == "000001"
```

```python
def test_file_lock_prevents_overlap(tmp_path):
    assert acquire_lock(tmp_path / "job.lock") is True
```

- [ ] **Step 2: Run the Python tests**

Before running tests:
- `python3 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r scripts/ingest/requirements.txt`

Run: `pytest tests/python -q`

Expected: FAIL with missing ingestion helpers

- [ ] **Step 3: Implement the shared ingestion helpers**

Required helpers:
- symbol normalization
- exchange derivation
- SQLite connection
- raw payload recording
- ingest run logging
- env loading for `DB_PATH`, `TUSHARE_TOKEN`, and `INGEST_USE_STUBS`

- [ ] **Step 4: Implement the source jobs**

Each job must:
- fetch source data
- normalize into canonical tables
- write directly to SQLite
- record raw payload metadata
- never overlap when invoked through `run_with_lock.sh`
- support stub mode when credentials are unavailable
- enforce `Asia/Shanghai` market-hours polling windows
- prune quote snapshots to maintain the 30-day retention target

- [ ] **Step 5: Implement backup and lock wrappers**

Required scripts:
- `run_with_lock.sh` using a portable lock approach that works on macOS and Linux
- `backup-sqlite.sh` for daily backup + checkpoint

Portable locking rule:
- do not assume `flock` exists
- preferred implementation: Python lockfile helper or `mkdir`-based lock directory strategy
- the same lock strategy must be used locally and in cron execution

- [ ] **Step 6: Write the source mapping and ops runbooks**

Document:
- source-to-table mapping
- cron examples
- backup/restore steps
- ingestion failure recovery
- production Nuxt/Nitro start command
- required env vars
- storage directory provisioning
- process manager guidance
- reverse proxy and TLS assumptions
- market-hours schedule and quote pruning jobs

- [ ] **Step 7: Run the Python tests again**

Run: `pytest tests/python -q`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add scripts/ingest scripts/backup-sqlite.sh tests/python docs/data/source-mapping.md docs/data/backup-restore.md docs/operations/deploy-runbook.md docs/operations/incident-runbook.md
git commit -m "feat: add ingestion jobs and ops scripts"
```

## Task 10: Finish Search, Smoke Checks, And Release-Ready Documentation

**Files:**
- Modify: `server/api/search.get.ts`
- Create: `server/api/health.get.ts`
- Modify: `server/repositories/articles.ts`
- Modify: `server/repositories/themes.ts`
- Modify: `server/repositories/stocks.ts`
- Create: `docs/testing/smoke-checklist.md`
- Create: `docs/implementation/migration-log.md`

- [ ] **Step 1: Write or expand the final smoke test checklist**

Checklist must cover:
- home route
- stock route
- stock quote snapshots API
- theme route
- article route
- premium gate
- beta login
- mock payment
- admin screens
- ingestion run visibility

- [ ] **Step 2: Ensure search documents stay in sync**

Required final checks:
- article publish updates FTS
- article unpublish removes FTS
- theme and stock ingestion rebuilds search rows

- [ ] **Step 3: Add the health endpoint**

`GET /api/health` must report:
- application process is up
- SQLite file is reachable
- last successful ingestion timestamp if available

- [ ] **Step 4: Run the full automated test suite**

Run: `npm run test`

Expected: all TypeScript and Python tests pass

- [ ] **Step 5: Run manual smoke verification**

Follow: `docs/testing/smoke-checklist.md`

Expected: all critical MVP flows verified locally

- [ ] **Step 6: Record migration and rollout notes**

Document:
- known gaps left for Phase 2
- real SMS and real WeChat Pay deferred work
- PostgreSQL migration triggers

- [ ] **Step 7: Commit**

```bash
git add docs/testing/smoke-checklist.md docs/implementation/migration-log.md server/api/search.get.ts server/api/health.get.ts server/repositories/articles.ts server/repositories/themes.ts server/repositories/stocks.ts
git commit -m "docs: finalize mvp smoke checks and rollout notes"
```

## Execution Notes

- Implement in order. Do not start billing before auth and repositories exist.
- Keep route shapes stable from the first public page task onward.
- `pages/stock/[symbol].html.vue`, `pages/theme/[id].html.vue`, and `pages/article/[id].html.vue` are intentional and must not be rewritten into slash-only routes.
- Do not add Redis, Postgres, OpenSearch, or real SMS/payment providers in this plan.
- Preserve the `xuangutong.com.cn/` mirror as a reference until public pages visually match the required sections.
- If `.git/` is absent when execution starts, initialize version control before Task 1 Step 10, or deliberately skip all commit checkboxes in this mirror workspace.
