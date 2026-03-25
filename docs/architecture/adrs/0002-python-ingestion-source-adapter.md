# ADR 0002: Keep Data Ingestion in Python Source Adapters

## Status
Accepted

## Context
The product depends on third-party APIs and transitional scraping. These sources are unstable, heterogeneous, and likely to change before formal licensed feeds are purchased.

## Decision
Implement source integration as Python ingestion jobs outside the Nuxt web process. Normalize all external data into internal canonical tables before public pages query it.

## Rationale
- Python has better ecosystem support for data fetching and scraping fallback
- Separates unstable source code from the public request path
- Makes later replacement of TuShare or scraped sources with Wind or iFinD easier
- Enables replay, backfill, and manual repair workflows without coupling to page rendering

## Consequences

### Positive
- Cleaner boundary between ingestion and serving
- Better resilience when a source breaks
- Easier raw payload capture and audit trails

### Negative
- Adds one more runtime component than a pure monolith
- Requires job scheduling and ingestion observability from day one

## Follow-Up
- Define canonical source adapter interfaces
- Store ingestion run logs and raw payload references
- Add manual re-sync tooling in admin
- Keep public pages read-only and served from canonical tables; ingestion writes remain off the request path
