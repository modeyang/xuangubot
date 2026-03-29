# Work Breakdown

This document records implementation ownership for the delivery tasks, and clarifies which flows are public vs admin-only.

## Task 8: Admin Views (This Change)

### Admin UI (Pages + Shared UI)
- `components/admin/AdminTable.vue`
  - Shared table component for admin pages.
- `pages/admin/index.vue`
  - Admin entrypoint linking to internal tools.
- `pages/admin/articles.vue`
  - Publish/unpublish controls by article ID.
- `pages/admin/homepage-modules.vue`
  - Enable/disable, reorder, and validated config edits for homepage modules.
- `pages/admin/theme-stocks.vue`
  - Review theme-stock relations (via public theme API) and trigger correction/resync actions.
- `pages/admin/orders.vue`
  - Read-only order inspection.
- `pages/admin/ingest-runs.vue`
  - Read-only ingest run inspection.

### Admin API (Nitro Server Routes)
- `server/api/admin/articles/[id]/publish.post.ts`
  - Admin-only publish: derives `body_html` from `body_markdown`, sets `status=published`, updates `published_at`.
  - Updates search visibility in `search_documents` (FTS) for public articles.
- `server/api/admin/articles/[id]/unpublish.post.ts`
  - Admin-only unpublish: sets `status=draft`, clears `published_at`, removes search visibility in `search_documents`.
- `server/api/admin/homepage-modules.post.ts`
  - Admin-only homepage module operations:
    - list (admin can see disabled modules)
    - enable/disable
    - reorder
    - update validated `config_json` per `module_key`
- `server/api/admin/theme-stocks/sync.post.ts`
  - Admin-only theme-stock correction:
    - `correct`: replace all theme-stock relations for a theme with a provided list of symbols
    - `resync`: best-effort rebuild from the latest `theme_snapshots.payload_json`
  - Writes audit logs for operator actions.
- `server/api/admin/orders.get.ts`
  - Admin-only list endpoint for orders.
- `server/api/admin/ingest-runs.get.ts`
  - Admin-only list endpoint for ingestion runs.

### Tests
- `tests/integration/admin.test.ts`
  - Route smoke checks for admin-only guards and basic behaviors (publish/unpublish, module config validation, list endpoints, theme-stock correction).

### API Documentation
- `docs/api/openapi.yaml`
  - Adds Task 8 admin endpoints to the OpenAPI contract.
- `docs/api/examples.md`
  - Adds curl examples for Task 8 admin endpoints.

## Public vs Admin-Only Flows

### Public
- Public API routes under `server/api/*` (non-admin) are readable without admin access:
  - Home modules: `/api/home`
  - Public stock/theme/article reads: `/api/stocks/:symbol`, `/api/themes/:id`, `/api/articles/:id`
  - Search fallback: `/api/search`
- Public pages under `pages/*` (non-admin) remain accessible to regular users.

### Admin-Only
- All routes under `server/api/admin/*` require an authenticated admin session (`requireAdmin`).
- All pages under `pages/admin/*` enforce admin-only access via page middleware (server-side 403; client redirects to `/login`).

