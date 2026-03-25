# Acceptance Criteria (Task 1 Bootstrap)

Date: 2026-03-25

## Workspace Bootstrap
- A Nuxt 3 workspace exists with `nuxt.config.ts`, `app.vue`, and a global legacy CSS file.
- Vitest is configured as the only JS test runner.
- Integration tests live under `tests/integration/`.
- Nuxt integration harness uses `@nuxt/test-utils/e2e` and starts Nitro with `server: true`.
- Test harness sets a single temporary SQLite path via `process.env.DB_PATH` before Nitro boots.
- Harness teardown removes the run-local temporary database directory after the test run.

## Test Execution
- Running `npm run test:integration -- tests/integration/app-shell.test.ts` passes.

## Product/Route Policy (Documented)
- Requirements docs explicitly state:
  - public read-only constraint
  - closed beta login/purchase constraint (until real SMS)
  - legacy route preservation
  - mock payment constraint

