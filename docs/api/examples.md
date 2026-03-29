# Public API Examples

All examples assume a local dev server running on `http://localhost:3000`.

## Home

Request:

```bash
curl -sS http://localhost:3000/api/home | jq .
```

Response shape:

```json
{
  "modules": [
    {
      "id": 1,
      "moduleKey": "featured_topics",
      "title": "Featured Topics",
      "sortOrder": 10,
      "config": { "themeIds": [18129294], "limit": 8 }
    }
  ]
}
```

Note: in the integration test harness we seed `plans` and minimal fixtures; homepage modules may be empty unless `seed:homepage` is run.

## Stock Snapshot

Request:

```bash
curl -sS http://localhost:3000/api/stocks/000001 | jq .
```

Response shape:

```json
{
  "stock": {
    "id": 1,
    "symbol": "000001",
    "exchange": "SZ",
    "name": "Ping An Bank",
    "status": "active",
    "industry": "banking",
    "profileJson": null
  },
  "quote": null,
  "themes": [],
  "articles": [],
  "announcements": []
}
```

## Article

Public article:

```bash
curl -sS http://localhost:3000/api/articles/1261948 | jq .
```

Response shape:

```json
{
  "article": {
    "id": 1261948,
    "slug": "public-1",
    "title": "Public Article",
    "excerpt": "excerpt",
    "bodyMarkdown": "# hello",
    "bodyHtml": "<h1>hello</h1>",
    "articleType": "article",
    "visibility": "public",
    "status": "published",
    "coverUrl": null,
    "publishedAt": "2026-03-25T00:00:00.000Z",
    "sourceName": "fixture",
    "sourceRef": null
  },
  "access": { "visibility": "public", "allowed": true, "reason": null },
  "relatedStocks": [],
  "relatedThemes": []
}
```

Premium article (body redacted for public API):

```bash
curl -sS http://localhost:3000/api/articles/2260001 | jq .
```

Response shape:

```json
{
  "article": {
    "id": 2260001,
    "slug": "premium-zzd-1",
    "title": "Premium ZZD",
    "excerpt": "premium excerpt",
    "bodyMarkdown": null,
    "bodyHtml": null,
    "articleType": "zzd",
    "visibility": "premium",
    "status": "published",
    "coverUrl": null,
    "publishedAt": "2026-03-25T01:00:00.000Z",
    "sourceName": "fixture",
    "sourceRef": null
  },
  "access": { "visibility": "premium", "allowed": false, "reason": "premium" },
  "relatedStocks": [],
  "relatedThemes": []
}
```

## Billing Plan

Request:

```bash
curl -sS http://localhost:3000/api/plans | jq .
```

Response shape:

```json
{
  "plan": {
    "id": 1,
    "planCode": "premium_bundle",
    "name": "Premium Bundle",
    "durationDays": 30,
    "priceCents": 9900,
    "enabled": 1
  }
}
```

## Auth: Request Login Code

Request a one-time login code (fake SMS):

```bash
curl -sS -X POST http://localhost:3000/api/auth/request-code \
  -H 'content-type: application/json' \
  -d '{"phone":"15500009001"}' | jq .
```

Response shape:

```json
{ "ok": true }
```

Note: in non-development mode (`APP_ENV !== development`), the phone must be allowlisted. The OTP code is never returned from this public endpoint.

## Auth: Verify Login Code

Verify the code and receive a signed HTTP-only cookie (`xgt_session_token`):

```bash
curl -i -X POST http://localhost:3000/api/auth/verify-code \
  -H 'content-type: application/json' \
  -d '{"phone":"15500009001","code":"123456"}'
```

Successful responses include a `Set-Cookie` header and a user payload:

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "phone": "15500009001",
    "role": "user",
    "displayName": null
  }
}
```

## Auth: Current User (`/api/me`)

Without a session cookie:

```bash
curl -sS http://localhost:3000/api/me | jq .
```

```json
{ "user": null }
```

With a session cookie:

```bash
curl -sS http://localhost:3000/api/me \
  -H 'cookie: xgt_session_token=<signed-token>' | jq .
```

## Auth: Logout

```bash
curl -sS -X POST http://localhost:3000/api/auth/logout \
  -H 'cookie: xgt_session_token=<signed-token>' | jq .
```

## Admin: Beta Access List

Admin-only list endpoint:

```bash
curl -sS http://localhost:3000/api/admin/beta-access \
  -H 'cookie: xgt_session_token=<admin-signed-token>' | jq .
```

Response shape:

```json
{
  "phones": [
    {
      "phone": "15500009001",
      "enabled": 1,
      "createdAt": "2026-03-26T00:00:00.000Z",
      "createdBy": 1
    }
  ],
  "debugCodes": [
    {
      "phone": "15500009001",
      "codePlain": "123456",
      "createdAt": "2026-03-26T00:05:00.000Z"
    }
  ]
}
```

## Admin: Beta Access Mutation

Add or change an allowlisted phone:

```bash
curl -sS -X POST http://localhost:3000/api/admin/beta-access \
  -H 'content-type: application/json' \
  -H 'cookie: xgt_session_token=<admin-signed-token>' \
  -d '{"action":"add","phone":"15500009002"}' | jq .
```

Response shape:

```json
{
  "ok": true,
  "inserted": true
}
```

## Admin: Publish Article

```bash
curl -sS -X POST http://localhost:3000/api/admin/articles/1261948/publish \
  -H 'content-type: application/json' \
  -H 'cookie: xgt_session_token=<admin-signed-token>' \
  -d '{}' | jq .
```

## Admin: Unpublish Article

```bash
curl -sS -X POST http://localhost:3000/api/admin/articles/1261948/unpublish \
  -H 'cookie: xgt_session_token=<admin-signed-token>' | jq .
```

## Admin: Homepage Modules (List)

This endpoint is POST-only and multiplexes actions.

```bash
curl -sS -X POST http://localhost:3000/api/admin/homepage-modules \
  -H 'content-type: application/json' \
  -H 'cookie: xgt_session_token=<admin-signed-token>' \
  -d '{"action":"list"}' | jq .
```

## Admin: Homepage Modules (Update Config)

Example updating a `hot_stocks` module config:

```bash
curl -sS -X POST http://localhost:3000/api/admin/homepage-modules \
  -H 'content-type: application/json' \
  -H 'cookie: xgt_session_token=<admin-signed-token>' \
  -d '{"action":"setConfig","id":1,"config":{"symbols":["000001","600519"],"limit":8}}' | jq .
```

## Admin: Theme Stocks (Manual Correction)

```bash
curl -sS -X POST http://localhost:3000/api/admin/theme-stocks/sync \
  -H 'content-type: application/json' \
  -H 'cookie: xgt_session_token=<admin-signed-token>' \
  -d '{"action":"correct","themeId":18129294,"symbols":["000001","600519"],"source":"manual"}' | jq .
```

## Admin: Orders List

```bash
curl -sS http://localhost:3000/api/admin/orders \
  -H 'cookie: xgt_session_token=<admin-signed-token>' | jq .
```

## Admin: Ingest Runs List

```bash
curl -sS http://localhost:3000/api/admin/ingest-runs \
  -H 'cookie: xgt_session_token=<admin-signed-token>' | jq .
```
