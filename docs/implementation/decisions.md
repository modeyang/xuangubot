# Task 3 Decisions

This document records the minimum set of decisions made while implementing the Task 3 repository layer, seed scripts, and admin bootstrap.

## Python Writes Directly To SQLite

For ingestion or data-loading workflows, we treat SQLite as the source of truth and allow Python scripts to write directly to the SQLite database (using `sqlite3` / SQL), without going through the Node/Drizzle ORM layer.

Rationale:
- The mirrored site content and ingestion jobs are not part of the runtime Nuxt server path.
- SQLite is a stable interchange boundary; direct SQL is simpler and easier to debug for ETL-style scripts.
- Keeping ingestion tooling decoupled avoids forcing Python jobs to depend on Node runtime conventions.

Non-goal:
- Provide a shared cross-language domain model. The boundary is the database schema.

## First Admin Bootstrap Rules

The first admin is bootstrapped via `scripts/bootstrap-admin.ts`:
- The script requires `ADMIN_BOOTSTRAP_PHONE` and exits non-zero when missing.
- If no admin exists yet, it inserts a `users` row for the provided phone or promotes that same phone if the user already exists.
- If an admin already exists for the same phone, reruns are idempotent.
- If an admin already exists for a different phone, bootstrap fails non-zero and does not promote another phone.
- It ensures the phone is present and enabled in `beta_access_phones` (allowlist).

Non-goal:
- Bootstrapping sessions, OTP delivery, or any UI flow. This is just a DB bootstrap.

## Repository Boundaries And Non-goals

Repositories live under `server/repositories/` and provide a small, testable DB access layer:
- Reads use Drizzle ORM where convenient (simple selects, ordering).
- Writes that benefit from tight control, transactions, or SQLite-specific behavior use `better-sqlite3` directly via `getDb().sqlite`.
- Public API is intentionally small (only the methods required by the Task 3 checklist).

Non-goals:
- No HTTP API handlers or UI features.
- No auth/session management beyond login code verification primitives.
- No real payment providers; only `completeMockPayment` for local/dev and test paths.

## Task 3 Verification Evidence

Because this workspace has no `.git/` history, the red-green workflow evidence is recorded here explicitly.

Observed sequence during Task 3:
- Before repository files existed, `npm run test:unit -- tests/unit/repositories.test.ts` failed because the repository modules could not be resolved.
- After implementing the repository layer, seed scripts, and bootstrap script, `npm run test:unit -- tests/unit/repositories.test.ts` passed.
- After the quality fixes, focused unit coverage also exercises the real operational scripts: missing `ADMIN_BOOTSTRAP_PHONE` fails non-zero, rerunning bootstrap/seed scripts stays idempotent, and bootstrap rejects a second phone once a first admin already exists.

This note exists to preserve the test-first evidence that would normally be visible in commit history.
