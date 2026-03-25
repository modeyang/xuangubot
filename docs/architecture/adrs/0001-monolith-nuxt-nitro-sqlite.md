# ADR 0001: Use Nuxt 3 + Nitro + SQLite for MVP

## Status
Accepted

## Context
The project is rebuilding a static market-content website into a dynamic public MVP. The approved constraints are:

- MVP first
- preserve existing style and route shape
- single-instance deployment is acceptable
- storage should start with SQLite
- public pages are read-only without login
- login and purchase flows are closed beta until a real SMS provider is integrated
- login, subscription, and payment are in scope (payment is mocked in MVP)

## Decision
Use a single Nuxt 3 application with Nitro server routes and SQLite as the only database for MVP.

## Rationale
- Lowest delivery overhead for a public MVP
- Best fit for SSR page rendering plus internal APIs in one codebase
- Simplest deployment and operations model for a single machine
- Keeps room for later migration by bootstrapping the workspace around Nuxt, Nitro, and SQLite without committing Task 1 to a finished schema/migration layer yet

## Consequences

### Positive
- Faster implementation
- Fewer moving parts
- Easier documentation and onboarding

### Negative
- Limited write concurrency
- No horizontal scaling without later redesign
- Search and analytics capability intentionally constrained

## Follow-Up
- Enable SQLite WAL mode
- Add real schema definitions and non-placeholder Drizzle migration scripts in follow-on tasks
- Keep repository layer portable to PostgreSQL
- Reassess persistence after MVP usage and data volume are observed
