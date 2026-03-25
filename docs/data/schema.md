# SQLite Schema (MVP)

This document describes the MVP SQLite schema as defined in `db/schema/*` plus manual migrations under `db/migrations/manual/`.

## Market and Content

### `stocks`
Purpose: Canonical stock master list for per-symbol pages.

Primary key: `id` (legacy-aligned numeric ID).

Constraints and indexes:
- `symbol` is unique (required).

### `stock_quotes`
Purpose: Minute-level quote snapshots for market window charts and summary widgets.

Primary key: composite (`stock_id`, `quoted_at`).

Indexes:
- (`stock_id`, `quoted_at`) (required)

Retention:
- Append-only within a bounded retention window.
- MVP target retention for minute-level snapshots: 30 calendar days (older rows eligible for cleanup).

### `stock_daily_bars`
Purpose: Daily OHLCV bars for basic charts and trends.

Primary key: composite (`stock_id`, `trade_date`).

Indexes:
- (`stock_id`, `trade_date`) (required)

### `themes`
Purpose: Canonical concept/theme list for theme pages.

Primary key: `id` (legacy-aligned numeric ID).

### `theme_stocks`
Purpose: Join table linking themes to stocks with optional scoring.

Primary key: composite (`theme_id`, `stock_id`).

### `theme_snapshots`
Purpose: Time series snapshots of theme heat/rank and raw payload.

Primary key: composite (`theme_id`, `captured_at`).

### `articles`
Purpose: Canonical article content powering public pages and premium gating.

Primary key: `id` (legacy-aligned numeric ID).

Indexes:
- `published_at` (required)

### `article_stocks`, `article_themes`
Purpose: Join tables linking articles to related stocks/themes.

Primary keys:
- `article_stocks`: composite (`article_id`, `stock_id`)
- `article_themes`: composite (`article_id`, `theme_id`)

### `announcements`
Purpose: Stock announcement/news feed items associated to a stock.

Primary key: `id`.

## Homepage and Search

### `homepage_modules`
Purpose: Admin-configurable homepage module slots and config JSON.

Primary key: `id`.

### `search_documents` (FTS5 virtual table)
Purpose: Full-text search for articles, themes, and stocks.

Ownership and update rules:
- This is an FTS5 virtual table created via a manual SQL migration.
- Article publish/unpublish must write through to FTS rows.
- Stock/theme ingestion rebuilds or upserts FTS rows.
- A nightly repair job rebuilds FTS from canonical tables to correct drift.

### `manual_migrations`
Purpose: Tracks hand-written SQL migrations that sit alongside Drizzle-generated migrations.

Primary key: `name`.

Operational notes:
- Files live under `db/migrations/manual/`.
- `scripts/apply-manual-migrations.ts` applies them in lexical order and records `applied_at`.

## Auth and Billing

### `users`
Purpose: Account records (phone-based) and roles.

Primary key: `id`.

### `login_codes`
Purpose: One-time login code requests (hashed).

Primary key: `id`.

Indexes:
- (`phone`, `expires_at`) (required)

### `login_code_debug`
Purpose: Non-production debug visibility for generated login codes.

Primary key: `id`.

### `sessions`
Purpose: Session storage for logged-in users.

Primary key: `id` (token identifier).

### `beta_access_phones`
Purpose: Allowlist table controlling who can access beta flows.

Primary key: `phone`.

Allowlist and admin bootstrap notes:
- The first admin is created by a one-time bootstrap script (outside Task 2 scope).
- The bootstrap phone is sourced from `ADMIN_BOOTSTRAP_PHONE`.
- Bootstrap inserts/promotes the admin user and adds their phone to `beta_access_phones`.

### `plans`
Purpose: Commercial plan definitions.

Primary key: `id`.

Constraints:
- `plan_code` is unique (required).

### `orders`
Purpose: Payment/order records for plan purchase attempts.

Primary key: `id`.

Constraints:
- `provider_order_id` is unique when present (SQLite UNIQUE allows multiple NULLs).

### `entitlements`
Purpose: Time-bounded access grants derived from paid orders.

Primary key: `id`.

## Ingestion and Audit

### `ingest_runs`
Purpose: Job run logging for ingestion and reconciliation.

Primary key: `id`.

### `raw_source_records`
Purpose: Raw capture metadata for fetched upstream payloads.

Primary key: `id`.

### `audit_logs`
Purpose: Append-only audit trail for admin and system actions.

Primary key: `id`.
