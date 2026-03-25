# MVP Scope (Dynamic Xuangutong)

Date: 2026-03-25

## Goal
Convert the existing static HTTrack mirror into a dynamic public website while preserving the current visual style, URL semantics, and core page types.

## Product Constraints (MVP)
- Public pages remain readable without login.
- Login and purchase flows are **closed beta** for approved testers/operators until a real SMS provider is integrated.
- Preserve legacy public route shapes for continuity and SEO:
  - `/`
  - `/stock/:symbol.html`
  - `/theme/:id.html`
  - `/article/:id.html`
  - `/ts/home`
  - `/zzd/home`
- Payment is **mocked** in MVP (provider adapter pattern, no real money movement).

## In Scope
- Dynamic homepage modules (hot themes, movers, curated content, article feeds).
- Stock pages:
  - base profile
  - latest quote snapshot
  - related themes
  - related articles/announcements
- Theme pages:
  - theme profile
  - related stocks
  - heat/activity snapshot
  - related articles
- Article pages:
  - free and paid variants
  - entitlement gating for `早知道` and `脱水研报`
- One subscription plan that unlocks both premium sections.
- Minimal internal admin capabilities:
  - publish/unpublish articles
  - configure homepage modules
  - inspect ingestion jobs and order status
- Search limited to: articles, stocks, themes (SQLite FTS5).
- Background ingestion jobs (Python) that write canonicalized data into SQLite.

## Out of Scope
- Level-2/order book data or tick-grade delivery.
- Community features (comments, social graph).
- Native apps / mini program.
- Multi-instance deployment, distributed queues, distributed cache.
- Real SMS delivery for open public self-service login/purchase onboarding.

