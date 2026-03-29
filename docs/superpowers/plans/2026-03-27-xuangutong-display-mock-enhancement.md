# Xuangutong Display Mock Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the current MVP with richer mock/demo data and render that data as real content cards so the site looks like a presentable investment-research product on the key demo pages.

**Architecture:** Keep the existing Nuxt + Nitro + SQLite architecture unchanged. Improve presentation by expanding fixture/homepage seed data and by teaching existing public pages and `/api/home` to render richer item payloads rather than config/debug views. No route changes, no new product scope.

**Tech Stack:** Nuxt 3, Nitro server routes, TypeScript, SQLite, existing fixture/seed scripts, Vitest integration tests

---

## File Map

### Seeds and Data Assembly
- Modify: `scripts/seed-homepage.ts`
- Modify: `scripts/seed-fixtures.ts`
- Modify: `server/repositories/homepage.ts`
- Modify: `server/repositories/stocks.ts`
- Modify: `server/repositories/themes.ts`
- Modify: `server/repositories/articles.ts`
- Modify: `server/api/home.get.ts`
- Modify: `server/api/articles/premium.get.ts`

### Components
- Modify: `components/home/HomeModuleList.vue`
- Modify: `components/stocks/StockSummaryCard.vue`
- Modify: `components/stocks/DailyBarsPanel.vue`
- Modify: `components/themes/ThemeSummaryCard.vue`
- Modify: `components/articles/PremiumGate.vue`
- Modify: `components/articles/ArticleBody.vue`

### Pages
- Modify: `pages/index.vue`
- Modify: `pages/stock/[symbol].html.vue`
- Modify: `pages/theme/[id].html.vue`
- Modify: `pages/article/[id].html.vue`
- Modify: `pages/ts/home.vue`
- Modify: `pages/zzd/home.vue`

### Tests and Docs
- Modify: `tests/integration/app-shell.test.ts`
- Modify: `tests/integration/public-api.test.ts`
- Create: `docs/implementation/display-mock-notes.md`

## Task 1: Expand Demo Fixtures

**Files:**
- Modify: `scripts/seed-fixtures.ts`
- Modify: `tests/integration/public-api.test.ts`

- [ ] **Step 1: Add a failing fixture expectation to integration tests**

Add assertions that require:
- at least 4 `ts` list rows
- at least 4 `zzd` list rows
- `/stock/000001.html` related sections to be non-empty through API data

- [ ] **Step 2: Run the focused public integration test to verify failure**

Run: `npm run test:integration -- tests/integration/public-api.test.ts`
Expected: FAIL because current fixture density is too low

- [ ] **Step 3: Extend fixture data in `scripts/seed-fixtures.ts`**

Add:
- 5 to 8 stocks total
- 3 to 5 themes total
- at least 2 related stocks for theme `18129294`
- at least 2 related articles for stock `000001`
- at least 2 announcements for stock `000001`
- at least 5 daily bars for stock `000001`
- at least 4 `ts` articles with descending `published_at`
- at least 4 `zzd` articles with descending `published_at`

- [ ] **Step 4: Re-run the focused integration test**

Run: `npm run test:integration -- tests/integration/public-api.test.ts`
Expected: PASS for the new fixture-density assertions

- [ ] **Step 5: Commit (optional)**

```bash
git add scripts/seed-fixtures.ts tests/integration/public-api.test.ts
git commit -m "feat: expand display demo fixtures"
```

## Task 2: Replace Homepage Debug Rendering With Real Content Cards

**Files:**
- Modify: `server/api/home.get.ts`
- Modify: `components/home/HomeModuleList.vue`
- Modify: `pages/index.vue`

- [ ] **Step 1: Add a failing homepage assertion**

Add test coverage that homepage HTML no longer shows raw config JSON blocks and instead shows visible content cards/items.

- [ ] **Step 2: Run homepage integration to verify failure**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`
Expected: FAIL because homepage still renders debug-like module JSON

- [ ] **Step 3: Enrich `/api/home` item payloads**

For each module key, return concrete items:
- `featured_topics` -> theme cards
- `hot_stocks` -> stock rows/cards
- `latest_articles` -> article teasers
- `premium_teasers` -> premium teaser cards

- [ ] **Step 4: Replace `HomeModuleList` JSON rendering with card rendering**

Render typed module sections:
- title + list/card content
- no raw `JSON.stringify` output

- [ ] **Step 5: Re-run homepage integration**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`
Expected: PASS with content-card based homepage rendering

- [ ] **Step 6: Commit (optional)**

```bash
git add server/api/home.get.ts components/home/HomeModuleList.vue pages/index.vue tests/integration/app-shell.test.ts
git commit -m "feat: render homepage modules as content cards"
```

## Task 3: Fill Stock and Theme Pages With Denser Content

**Files:**
- Modify: `pages/stock/[symbol].html.vue`
- Modify: `pages/theme/[id].html.vue`
- Modify: `components/stocks/StockSummaryCard.vue`
- Modify: `components/stocks/DailyBarsPanel.vue`
- Modify: `components/themes/ThemeSummaryCard.vue`

- [ ] **Step 1: Add failing display assertions for stock/theme detail pages**

Add checks that:
- `/stock/000001.html` shows daily bars, themes, and related articles
- `/theme/18129294.html` shows multiple related stocks and articles

- [ ] **Step 2: Run `app-shell` integration to verify failure**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`
Expected: FAIL if the current pages still render sparse/empty sections

- [ ] **Step 3: Improve stock page composition**

Ensure stock page shows:
- summary card
- populated daily bars section
- related themes list
- related articles list
- announcements list

- [ ] **Step 4: Improve theme page composition**

Ensure theme page shows:
- summary card
- populated stock list
- populated related article list

- [ ] **Step 5: Re-run detail-page integration**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts`
Expected: PASS with visibly populated detail sections

- [ ] **Step 6: Commit (optional)**

```bash
git add pages/stock/[symbol].html.vue pages/theme/[id].html.vue components/stocks/StockSummaryCard.vue components/stocks/DailyBarsPanel.vue components/themes/ThemeSummaryCard.vue tests/integration/app-shell.test.ts
git commit -m "feat: enrich stock and theme detail pages"
```

## Task 4: Improve TS / ZZD List Presentation

**Files:**
- Modify: `server/api/articles/premium.get.ts`
- Modify: `pages/ts/home.vue`
- Modify: `pages/zzd/home.vue`
- Modify: `tests/integration/public-api.test.ts`
- Modify: `tests/integration/app-shell.test.ts`

- [ ] **Step 1: Add failing assertions for list density and presentation**

Add checks that:
- `TS` and `ZZD` pages show multiple rows
- rows display title, source, time, and teaser messaging

- [ ] **Step 2: Run integration tests to verify failure**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts tests/integration/public-api.test.ts`
Expected: FAIL if list presentation is still too thin

- [ ] **Step 3: Tighten teaser/list payload shape and ordering**

Ensure `/api/articles/premium` remains teaser-safe and returns:
- title
- source
- published time
- excerpt/teaser
- access state

- [ ] **Step 4: Improve `TS` and `ZZD` page card/list presentation**

Render each row with:
- stronger hierarchy
- clearer metadata
- entitlement messaging

- [ ] **Step 5: Re-run integration tests**

Run: `npm run test:integration -- tests/integration/app-shell.test.ts tests/integration/public-api.test.ts`
Expected: PASS with denser list rendering

- [ ] **Step 6: Commit (optional)**

```bash
git add server/api/articles/premium.get.ts pages/ts/home.vue pages/zzd/home.vue tests/integration/app-shell.test.ts tests/integration/public-api.test.ts
git commit -m "feat: improve premium teaser list presentation"
```

## Task 5: Record Demo Display Decisions

**Files:**
- Create: `docs/implementation/display-mock-notes.md`

- [ ] **Step 1: Record final demo data assumptions**

Document:
- which stock/theme/article IDs are the fixed demo anchors
- which pages should be checked during manual demo

- [ ] **Step 2: Record display rules**

Document:
- homepage module rendering rules
- teaser-safe behavior for `/api/articles/premium`
- expected visible sections on stock/theme pages

- [ ] **Step 3: Commit (optional)**

```bash
git add docs/implementation/display-mock-notes.md
git commit -m "docs: capture display mock enhancement notes"
```

## Execution Notes

- Keep route shapes unchanged.
- Do not add new product scope or real data providers.
- Prefer improving seed data and current API payloads over inventing parallel mock-only codepaths.
- The five demo pages that must look populated are:
  - `/`
  - `/stock/000001.html`
  - `/theme/18129294.html`
  - `/ts/home`
  - `/zzd/home`
