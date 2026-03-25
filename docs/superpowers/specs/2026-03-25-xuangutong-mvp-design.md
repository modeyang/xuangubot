# Xuangutong Dynamic MVP Design

## Status
- Date: 2026-03-25
- Status: Draft for review
- Scope: Public MVP, monolith, single-instance deployment

## 1. Goal
Convert the current static mirror into a dynamic public website while preserving the existing visual style, URL semantics, and core product experience. The MVP must support:

- Dynamic homepage content
- Stock pages
- Theme pages
- Article pages
- Paid content for `早知道` and `脱水研报`
- Phone login, subscription entitlement, and payment
- Full-process documentation for requirements, design, APIs, implementation, testing, and operations

The product target is near-real-time content and data refresh at minute-level cadence, not trading-terminal-grade tick delivery.

Public page routes must preserve the current legacy path style rather than introducing a new public URL scheme.

## 2. Approved Constraints

### Product Constraints
- Public website
- Preserve current site tone, layout patterns, and main page types
- Preserve legacy public route style
- MVP first, not full platform rebuild
- Phase 1 includes subscription and payment

### Technical Constraints
- Architecture choice: true monolith
- Runtime shape: single app for SSR pages and backend APIs
- Database: SQLite for MVP
- Deployment: single machine, single application instance
- Background ingestion allowed as separate Python scheduled jobs
- No real SMS provider integration in MVP
- No microservices, no distributed cache, no multi-region design in MVP

### Data Constraints
- Transition path starts with third-party aggregation and scraping where necessary
- Current preferred source mix for MVP:
  - TuShare Pro for structured market and fundamentals where allowed
  - Official announcement/public disclosure sources such as CNINFO where allowed
  - Scraping adapters only as transitional fallback
- Formal licensed enterprise feeds such as Wind or iFinD are future replacements, not MVP dependencies

## 3. Scope

### In Scope
- Homepage with dynamic modules: hot themes, movers, curated content, article feeds
- Legacy public page routes retained, including:
  - `/`
  - `/stock/:symbol.html`
  - `/theme/:id.html`
  - `/article/:id.html`
  - `/ts/home`
  - `/zzd/home`
- Stock detail pages with:
  - base profile
  - latest quote snapshot
  - related themes
  - related articles and announcements
- Theme detail pages with:
  - theme profile
  - related stocks
  - heat or activity snapshot
  - related articles
- Article pages with free and paid variants
- Login flow implemented with a fake SMS adapter for development and controlled beta use
- One subscription plan that unlocks both `早知道` and `脱水研报`
- Subscription plans, order creation, payment callback, entitlement gating
- Public read access for content pages
- Closed beta login and purchase flows for approved testers and operators until real SMS is integrated
- Minimal internal admin pages for:
  - publish/unpublish articles
  - configure homepage modules
  - inspect ingestion jobs and order status
- Search limited to articles, stocks, and themes
- Documentation baseline for all implementation stages

### Out of Scope
- Level-2 or order-book data
- Community features, comments, or social graphs
- Native app or mini program
- Multi-provider membership hierarchy
- Real SMS delivery integration for open public self-service login
- Open public self-service purchase onboarding before real SMS integration is completed
- Multi-instance deployment
- Distributed job queue
- Recommendation engine or personalized feed ranking
- Full-featured CMS with workflow approvals

## 4. Recommended MVP Architecture

## 4.1 High-Level Shape

```text
Browser
  -> Nuxt 3 SSR pages
  -> Nitro server API routes
  -> SQLite database
  -> local file storage for raw snapshots / media / backups metadata

Python scheduled jobs
  -> fetch third-party data
  -> normalize to canonical records
  -> write directly into SQLite
```

The architecture is intentionally simple:

- `Nuxt 3` renders pages and hosts server routes in one application
- `Nitro` provides internal APIs for page data, auth, subscription, payment, and admin operations
- `SQLite` stores business data in one file with `WAL` mode enabled
- `Python` scripts handle unstable or source-specific ingestion logic outside the main web process
- MVP ingestion write-path is `Python -> SQLite direct`

## 4.2 Why This Shape
- Lowest implementation overhead
- Best fit for single-instance MVP
- Easiest way to preserve existing SSR-style routes and page structure
- Keeps future migration path open by isolating source adapters and repository interfaces

## 4.3 Route Policy
Public pages keep the current legacy route shape for compatibility, SEO continuity, and lower migration risk.

- homepage: `/`
- stock page: `/stock/:symbol.html`
- theme page: `/theme/:id.html`
- article page: `/article/:id.html`
- premium landing pages: `/ts/home`, `/zzd/home`

Internal APIs remain separated under `/api/...` and are not coupled to public route shapes.

Legacy identifier policy:
- stock public route identifier uses the stock symbol, for example `/stock/600519.html`
- theme public route identifier uses the legacy numeric theme ID already present in the mirrored site
- article public route identifier uses the legacy numeric article ID already present in the mirrored site
- in MVP, the legacy numeric theme ID is also the canonical public theme ID
- in MVP, the legacy numeric article ID is also the canonical public article ID
- `themes.id` and `articles.id` store those legacy numeric public identifiers
- `themes.slug` and `articles.slug` are optional internal-friendly fields for admin, search, and future URL experiments, but are not used in MVP public URLs
- `source_ref` stores upstream source identifiers when they differ from the public legacy identifier
- upstream theme/article identifiers that do not match the public legacy ID are mapped into local canonical IDs during ingestion and stored in `source_ref`
- stock symbols are stored as strings, preserve leading zeroes, and are normalized before persistence
- `exchange` is derived during ingestion from trusted source metadata and validated before the record is published

## 5. Technology Decisions

## 5.1 Web App
- Framework: `Nuxt 3`
- Rendering: SSR by default, cache selected public endpoints/pages
- Styling strategy: preserve current visual system first, then normalize incrementally

## 5.2 Server Layer
- Server runtime: `Nitro` server routes inside the same Nuxt app
- Validation: `zod`
- Session model: signed HTTP-only cookie plus server-side session table
- SMS provider mode for MVP: `fake`

## 5.3 Database
- Database engine: `SQLite`
- Access layer: `drizzle-orm`
- Driver: `better-sqlite3`
- SQLite settings:
  - `PRAGMA journal_mode=WAL`
  - `PRAGMA synchronous=NORMAL`
  - `PRAGMA foreign_keys=ON`
  - scheduled checkpoint and backup jobs

This choice keeps the schema portable and reduces migration pain when moving to PostgreSQL later.

## 5.4 Background Jobs
- Language: `Python`
- Responsibilities:
  - data source adapters
  - scraping fallback
  - normalization
  - backfill and re-sync jobs
  - ingestion run logging

## 5.5 Search
- MVP search engine: `SQLite FTS5`
- Search scope:
  - articles
  - themes
  - stocks by name or symbol

This avoids introducing OpenSearch or Meilisearch too early.

Search synchronization policy:
- `search_documents` is updated write-through on article publish and unpublish actions
- stock and theme search documents are updated during ingestion sync jobs
- one nightly rebuild job exists as repair tooling, not as the main update path

## 5.6 Payment
- Payment integration pattern: provider adapter inside monolith
- MVP payment provider: `mock`
- MVP payment mode: simulated payment inside the monolith
- payment acceptance for MVP means:
  - order creation works end-to-end
  - operator or test user can complete a mock payment action
  - order status changes to paid through the mock provider path
  - entitlement is granted idempotently
  - subscription-gated article access changes immediately after payment success
- mock payment verification rule:
  - `mock/create` returns a one-time payment token
  - `mock/complete` accepts only authenticated beta users or admins
  - completion is idempotent by `orderId`
- real WeChat Pay integration is deferred to Phase 2

## 5.7 Entitlement Model
- MVP plan model: one paid bundle
- plan code: `premium_bundle`
- unlocked content categories:
  - `zzd`
  - `ts`
- no separate paid tiers in MVP
- no single-article purchase in MVP

## 6. Proposed Repository Layout

This repository currently contains a static mirror. The dynamic app should be introduced without destroying the mirror reference immediately.

```text
docs/
  superpowers/specs/
  requirements/
  architecture/adrs/
  api/
  data/
  implementation/
  testing/
  operations/

app/
  components/
  composables/
  layouts/
  pages/

server/
  api/
  services/
  repositories/
  utils/
  auth/
  billing/
  admin/

db/
  schema/
  migrations/

scripts/
  ingest/
  backfill/
  backup/

storage/
  raw/
  uploads/
  backups/

xuangutong.com.cn/
  ... existing mirror kept as reference during migration
```

Repository rule for MVP:
- the Nuxt app will take over the repo root as the served application
- the current mirrored files remain in the repository only as migration reference material
- the mirror is not served side-by-side in production

## 7. Functional Design

## 7.1 Homepage
The homepage becomes a composition of configurable modules rather than a hard-coded static page. Initial modules:

- featured topics
- latest hot stocks or movers
- latest articles
- latest premium articles teasers
- latest announcement-related highlights

Each module is backed by one query and one admin configuration record. This keeps the front page editable without requiring a full CMS.

## 7.2 Stock Page
Each stock page should expose:

- stock identity and basic profile
- latest quote snapshot
- recent daily bars
- associated themes
- related articles
- related announcements

The page should render even if some sections are stale. Missing sections degrade independently.

## 7.3 Theme Page
Each theme page should expose:

- theme title and summary
- related stocks
- latest activity score or heat snapshot
- latest related articles

Theme definitions may originate from scraped or source-specific identifiers, but the public site uses one canonical theme ID. In MVP, that canonical ID is the same numeric theme ID used by the legacy mirrored routes.

## 7.4 Article Page
Articles are the main content unit. An article supports:

- type: news, analysis, `zzd`, `ts`
- visibility: public, login-required, subscription-required
- stock/theme relations
- excerpt, cover image, body, publish status

Premium articles should render teaser metadata for non-entitled users and full body for entitled users.

Canonical article storage rule:
- `body_markdown` is the editorial source of truth
- `body_html` is derived at publish or sync time for rendering speed and sanitization control

MVP article visibility matrix:
- `news`:
  - default visibility: `public`
  - full body visible to all
- `analysis`:
  - default visibility: `public`
  - can optionally be marked `login-required` for internal testing, but this is not the default public model
- `zzd`:
  - default visibility: `subscription-required`
  - teaser metadata and excerpt visible to all
  - full body requires active `premium_bundle`
- `ts`:
  - default visibility: `subscription-required`
  - teaser metadata and excerpt visible to all
  - full body requires active `premium_bundle`

Legacy premium page mapping:
- `/zzd/home` remains a public landing and listing page
- `/ts/home` remains a public landing and listing page
- premium article detail pages remain publicly discoverable, but gated at full-content level

## 7.5 Auth, Subscription, and Payment
MVP auth flow:

1. user requests phone verification code
2. fake provider stores code with TTL and rate limits and exposes it only in controlled environments or admin tooling
3. user verifies code and receives session cookie
4. user views plans
5. user creates order
6. payment callback marks order paid
7. entitlement row is created or extended

Only one entitlement concept is needed for MVP: active access to premium article categories.

MVP entitlement rule:
- one active entitlement type: `premium_bundle`
- entitlement grants full-content access to both `zzd` and `ts`
- `login-required` remains available as a content flag but is not used to define a second paid tier
- entitlement extension rule:
  - if the user already has an active `premium_bundle`, extend `ends_at` by `duration_days` from the current `ends_at`
  - if there is no active entitlement, start at current completion time and set `ends_at = starts_at + duration_days`

MVP operational rule:
- public site content is open to all readers
- auth, paid access, and purchase flows are implemented for controlled testing and beta use
- real public self-service phone onboarding is deferred until a real SMS provider is integrated
- MVP rollout mode is therefore:
  - public read-only browsing for all visitors
  - controlled beta login for approved users
  - controlled beta purchase and entitlement testing for approved users

Rollout controls:
- production `POST /api/auth/request-code` is restricted to a phone allowlist stored in the database
- only admin users can add or remove phones from that allowlist
- non-allowlisted phones receive a generic denied response and no code is issued
- in development and staging, fake SMS codes may be exposed in logs or admin-visible debug output
- in production, fake SMS codes are visible only through admin-observable tooling, not public API responses
- login eligibility during public read-only rollout is limited to allowlisted beta users and admins

## 7.6 Admin
Minimal internal admin pages inside the same app:

- article publish/unpublish
- homepage module ordering
- theme-stock manual correction
- order lookup
- ingestion run status

No rich text workflow or complex approval pipeline in MVP.

## 8. Data Ingestion Design

## 8.1 Core Rule
The web layer never depends on third-party response shapes directly. All incoming data is normalized into internal canonical models before page queries use it.

## 8.2 Source Adapter Pattern
Each source adapter must map into internal models:

- stock
- quote snapshot
- daily bar
- theme
- theme-stock relation
- article
- announcement

Recommended adapters for MVP:
- `tushare_adapter`
- `cninfo_adapter`
- `scrape_adapter`
- `manual_override_adapter`

Future adapters:
- `wind_adapter`
- `ifind_adapter`

## 8.3 Refresh Cadence
- homepage hot modules: every 1 to 5 minutes
- quote snapshot: every 1 to 5 minutes during market hours
- announcements: every 5 minutes
- article pulls and premium content sync: every 5 to 15 minutes
- daily bars and fundamentals: end-of-day and scheduled backfill

## 8.4 Scheduling and Runtime Rules
MVP scheduling is host-based and deliberately simple.

- scheduler mechanism: system `cron`
- runtime timezone: `Asia/Shanghai`
- overlap prevention: file lock per job on the single host
- overlap rule: if a prior run still holds the lock, the next run is skipped and logged
- failure handling:
  - transient failures use bounded retry inside the job
  - repeated failures are recorded in `ingest_runs`
  - jobs never run concurrently for the same lock key
- manual recovery:
  - operators can rerun jobs through script entrypoints
  - backfill jobs are separate from polling jobs

Market-hours definition for minute-level jobs:
- pre-open watch window: `09:15-09:30`
- morning session: `09:30-11:30`
- afternoon session: `13:00-15:00`
- outside those windows, quote polling stops and only content, announcement, reconciliation, and backfill jobs continue

Recommended cron classes:
- every 1 minute:
  - quote snapshot refresh during market windows
- every 5 minutes:
  - homepage hot module rebuild
  - announcement sync
  - premium article sync
- hourly:
  - unpaid order reconciliation
  - ingestion health checks
- nightly:
  - daily bar backfill
  - fundamentals sync
  - FTS rebuild verification
  - SQLite backup and checkpoint

## 8.5 Raw Capture
Every ingestion run should store:

- source name
- source object identifier
- fetched timestamp
- normalization status
- raw payload path or payload hash

This is required for debugging and future source replacement.

## 9. Data Model

## 9.1 Core Tables

### Market and Content
- `stocks`
  - `id`
  - `symbol`
  - `exchange`
  - `name`
  - `status`
  - `industry`
  - `profile_json`
- `stock_quotes`
  - `stock_id`
  - `quoted_at`
  - `last_price`
  - `pct_change`
  - `turnover`
  - `volume`
- `stock_daily_bars`
  - `stock_id`
  - `trade_date`
  - `open`
  - `high`
  - `low`
  - `close`
  - `volume`
  - `turnover`
- `themes`
  - `id`
  - `slug`
  - `name`
  - `summary`
  - `source_ref`
- `theme_stocks`
  - `theme_id`
  - `stock_id`
  - `score`
  - `source`
- `theme_snapshots`
  - `theme_id`
  - `captured_at`
  - `heat_score`
  - `rank`
  - `payload_json`
- `articles`
  - `id`
  - `slug`
  - `title`
  - `excerpt`
  - `body_markdown`
  - `body_html`
  - `article_type`
  - `visibility`
  - `status`
  - `cover_url`
  - `published_at`
  - `source_name`
  - `source_ref`
- `article_stocks`
  - `article_id`
  - `stock_id`
- `article_themes`
  - `article_id`
  - `theme_id`
- `announcements`
  - `id`
  - `stock_id`
  - `title`
  - `summary`
  - `published_at`
  - `source_name`
  - `source_url`

### Homepage and Search
- `homepage_modules`
  - `id`
  - `module_key`
  - `title`
  - `config_json`
  - `sort_order`
  - `enabled`
- `search_documents`
  - FTS5 virtual table for article/theme/stock search

Snapshot storage rule:
- `stock_quotes` is append-only within a bounded retention window
- MVP retention target for minute-level quote snapshots: 30 calendar days
- page queries read the latest row for summary sections and recent rows for lightweight trend displays

Upload and cover asset rule:
- MVP local uploads are stored under `storage/uploads/`
- `cover_url` may point to a local uploaded path or to a preserved upstream remote URL
- uploaded local assets are included in backup scope for MVP

Homepage module config rule:
- `homepage_modules.config_json` stores module-specific query and presentation settings
- MVP supported examples:
  - `featured_topics`: `{ "limit": 6 }`
  - `hot_stocks`: `{ "limit": 10, "marketWindowOnly": true }`
  - `latest_articles`: `{ "limit": 12, "types": ["news", "analysis"] }`
  - `premium_teasers`: `{ "limit": 6, "types": ["zzd", "ts"] }`

### Auth and Billing
- `users`
  - `id`
  - `phone`
  - `display_name`
  - `role`
  - `created_at`
- `login_codes`
  - `id`
  - `phone`
  - `code_hash`
  - `expires_at`
  - `used_at`
  - `request_ip`
- `beta_access_phones`
  - `phone`
  - `enabled`
  - `created_at`
  - `created_by`

Admin bootstrap rule:
- the first admin is created by a one-time bootstrap script
- bootstrap source: `ADMIN_BOOTSTRAP_PHONE` environment variable
- on bootstrap run, the specified phone is inserted or promoted as admin and added to `beta_access_phones`
- after first bootstrap, allowlist and admin management happen through admin tools only
- `sessions`
  - `id`
  - `user_id`
  - `session_token_hash`
  - `expires_at`
  - `last_seen_at`
- `plans`
  - `id`
  - `plan_code`
  - `name`
  - `duration_days`
  - `price_cents`
  - `enabled`
- `orders`
  - `id`
  - `user_id`
  - `plan_id`
  - `provider`
  - `amount_cents`
  - `status`
  - `provider_order_id`
  - `created_at`
  - `paid_at`
- `entitlements`
  - `id`
  - `user_id`
  - `entitlement_type`
  - `starts_at`
  - `ends_at`
  - `source_order_id`

### Ingestion and Audit
- `ingest_runs`
  - `id`
  - `job_name`
  - `source_name`
  - `started_at`
  - `finished_at`
  - `status`
  - `summary_json`
- `raw_source_records`
  - `id`
  - `source_name`
  - `source_ref`
  - `fetched_at`
  - `payload_path`
  - `payload_hash`
  - `normalize_status`
- `audit_logs`
  - `id`
  - `actor_type`
  - `actor_id`
  - `action`
  - `target_type`
  - `target_id`
  - `payload_json`
  - `created_at`

## 9.2 Data Modeling Rules
- public pages only query canonical tables
- source-specific fields go into `profile_json`, `payload_json`, or raw payload storage, not into page contracts by default
- premium content gating is driven by `articles.visibility` plus active `entitlements`
- `plans` contains one active commercial plan in MVP: `premium_bundle`
- `entitlements.entitlement_type` uses `premium_bundle` for paid article access
- MVP payment transitions are driven by the mock payment provider, not a real external gateway

## 10. API Surface

## 10.1 Public APIs
- `GET /api/home`
- `GET /api/stocks/:symbol`
- `GET /api/stocks/:symbol/quotes`
- `GET /api/stocks/:symbol/daily-bars`
- `GET /api/themes/:id`
- `GET /api/articles/:id`
- `GET /api/search?q=...`
- `GET /api/plans`

Public page rendering policy:
- page routes stay on legacy public paths
- server-side page loaders call the internal `/api/...` services or equivalent server functions
- no redirect-based migration to `/stocks/...`, `/themes/...`, or `/articles/...` in MVP

Minimal public response shapes:
- `GET /api/home`
  - returns `modules[]` with `module_key`, `title`, and `items[]`
- `GET /api/stocks/:symbol`
  - returns `stock`, `quote`, `themes[]`, `articles[]`, `announcements[]`
- `GET /api/stocks/:symbol/quotes`
  - returns minute-level quote snapshots only
- `GET /api/stocks/:symbol/daily-bars`
  - returns recent daily OHLCV bars for chart or trend sections
- `GET /api/themes/:id`
  - returns `theme`, `stocks[]`, `snapshot`, `articles[]`
- `GET /api/articles/:id`
  - returns `article`, `access`, `relatedStocks[]`, `relatedThemes[]`
- `GET /api/search`
  - returns grouped results: `stocks[]`, `themes[]`, `articles[]`
- `GET /api/plans`
  - returns enabled plans, which is one plan in MVP

## 10.2 Auth APIs
- `POST /api/auth/request-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/logout`
- `GET /api/me`

For MVP, `request-code` uses the fake SMS provider and must be environment-gated or admin-observable. It is not considered a production-grade public onboarding path.
In production, `request-code` is additionally restricted to the phone allowlist defined in `beta_access_phones`.

Minimal auth contract:
- `POST /api/auth/request-code`
  - input: `phone`
  - output: `requestAccepted`, plus debug code only in non-production or admin-observable mode
- `POST /api/auth/verify-code`
  - input: `phone`, `code`
  - output: `user`, `sessionCreated`
- `GET /api/me`
  - output: `user`, `entitlements[]`

## 10.3 Billing APIs
- `POST /api/orders`
- `POST /api/payments/mock/create`
- `POST /api/payments/mock/complete`
- `GET /api/me/subscription`

Minimal billing contract:
- `POST /api/orders`
  - input: `planCode`
  - output: `orderId`, `amountCents`, `status`
- `POST /api/payments/mock/create`
  - input: `orderId`
  - output: `paymentMode`, `paymentToken`, `status`
- `POST /api/payments/mock/complete`
  - input: `orderId` or `paymentToken`
  - output: paid order summary and entitlement effect
- `GET /api/me/subscription`
  - output: active plan summary and entitlement expiry

## 10.4 Admin APIs
- `POST /api/admin/articles/:id/publish`
- `POST /api/admin/articles/:id/unpublish`
- `POST /api/admin/homepage-modules`
- `POST /api/admin/theme-stocks/sync`
- `GET /api/admin/ingest-runs`
- `GET /api/admin/orders`

All APIs must be documented in `docs/api/` and reflected in the OpenAPI file before implementation is considered complete.

## 11. Non-Functional Requirements

### Performance
- cached public page render target: under 2.5s total load on typical broadband
- cached API target: under 300ms p95
- uncached page data API target: under 800ms p95

### Freshness
- hot page modules: 5 minutes max staleness
- stock snapshot sections: 5 minutes max during market hours
- premium articles: 15 minutes max after publish

### Availability
- MVP target: 99% availability
- acceptable maintenance mode: scheduled manual operations

### Security
- session cookies must be HTTP-only and signed
- rate limit verification code requests and login attempts
- payment callback verification is mandatory
- admin routes require admin role

### Reliability
- backup SQLite database at least daily
- keep raw source snapshots for replay and debugging
- define manual recovery procedure for failed ingestion jobs

### Operability
- structured application logs
- ingestion run logs with success/failure counts
- health endpoint for app process and database file status

## 12. Documentation Plan

The project requirement is that every implementation stage must be documented. The baseline doc set is:

```text
docs/
  requirements/
    mvp-scope.md
    acceptance-criteria.md
  superpowers/specs/
    2026-03-25-xuangutong-mvp-design.md
  architecture/adrs/
    0001-monolith-nuxt-nitro-sqlite.md
    0002-python-ingestion-source-adapter.md
  api/
    openapi.yaml
    examples.md
  data/
    schema.md
    source-mapping.md
    backup-restore.md
  implementation/
    work-breakdown.md
    migration-log.md
    decisions.md
  testing/
    test-cases.md
    smoke-checklist.md
  operations/
    deploy-runbook.md
    incident-runbook.md
```

Documentation rule:
- no feature is complete until code and its corresponding doc updates both land

## 13. Key Risks and Mitigations

### Data Licensing Risk
Risk:
- public display rights may not be covered by a low-cost or scraped source

Mitigation:
- keep all source adapters isolated
- record source provenance for each record
- maintain kill-switches per source and data domain
- prefer official/licensed replacements before scale-up

### SQLite Concurrency Risk
Risk:
- write contention under heavy ingestion or payment bursts

Mitigation:
- single instance only
- small transactions
- WAL mode
- move write-heavy analytics out of MVP

### Source Instability Risk
Risk:
- scraping adapters break silently

Mitigation:
- raw payload capture
- per-job health status
- source-specific failure alerts
- manual override admin paths

### Payment Reliability Risk
Risk:
- callback failure leaves paid order pending

Mitigation:
- idempotent callback handling
- payment reconciliation job
- admin order inspection tools

## 14. Migration Path Beyond MVP

The MVP must be built so that future migration to PostgreSQL is operationally possible without rewriting page or domain logic.

Required preparation:
- use `drizzle` schema and migrations from day one
- keep repository interfaces independent of SQLite-specific SQL where practical
- isolate FTS5-specific search logic behind one module
- avoid embedding raw SQL in page components

Planned migration path:
1. add PostgreSQL connection profile in staging
2. run same schema through drizzle migrations
3. bulk-import SQLite data
4. validate parity for pages and admin flows
5. cut over application configuration

## 15. Planning Readiness

This spec is ready for implementation planning if the following are accepted:
- single-instance deployment is acceptable for MVP
- one payment provider is acceptable for MVP
- SQLite is accepted as the initial persistence layer
- current page types and premium content model are the correct Phase 1 scope

If these remain true, the next step is implementation planning, not further architecture expansion.
