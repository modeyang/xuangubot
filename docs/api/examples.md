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

