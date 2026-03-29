# Xuangutong Display Mock Enhancement Design

## Status
- Date: 2026-03-27
- Status: Draft for review
- Scope: Display-layer enhancement only

## 1. Goal
Improve the current MVP so the site looks like a presentable investment-research product instead of a thin technical skeleton. This work does not change the core architecture or route structure. It improves perceived completeness by:

- adding richer mock/demo data
- increasing information density on key pages
- replacing debug-like JSON/config displays with real content cards
- keeping all existing public routes stable

## 2. Non-Goals
- No new real data providers
- No new billing or auth scope
- No major visual redesign or new design system
- No charting library integration beyond current simple table-style displays
- No restructuring of the public API contract unless required to support better mock display

## 3. Chosen Approach
Use a two-layer enhancement:

1. enrich seed/mock data so the site has enough content relationships to feel real
2. upgrade rendering of homepage, stock, theme, and premium list pages so they show product-like cards and grouped content rather than configuration/debug output

This keeps the work low-risk and aligned with the current codebase. It avoids inventing a separate mock provider abstraction at this stage.

## 4. Data Expansion

### 4.1 Minimum Mock Dataset
Extend fixture data so the UI has enough variety to render meaningfully:

- 5 to 8 stocks total
- 3 to 5 themes total
- 2 to 4 theme-stock relations per theme
- 3 to 5 articles per featured stock/theme cluster
- 2 to 4 announcements for key stocks
- 5 to 10 daily bars for key stocks
- at least 4 `ts` items
- at least 4 `zzd` items

### 4.2 Required Relationships
The following relationships must exist in seeded data:

- homepage modules -> visible items
- stock -> related themes
- stock -> related articles
- stock -> announcements
- theme -> stocks
- theme -> articles
- premium list pages -> multiple rows with descending `published_at`

The seeded data must make the following pages feel populated:

- `/`
- `/stock/000001.html`
- `/theme/18129294.html`
- `/ts/home`
- `/zzd/home`

These are mandatory fixture targets, not illustrative examples:

- `/stock/000001.html` must contain:
  - stock summary
  - at least 5 daily bars
  - at least 1 related theme
  - at least 2 related articles
  - at least 2 announcements
- `/theme/18129294.html` must contain:
  - theme summary
  - at least 2 related stocks
  - at least 2 related articles
- `/ts/home` must contain at least 4 `ts` rows ordered by `published_at desc`
- `/zzd/home` must contain at least 4 `zzd` rows ordered by `published_at desc`
- `/` must show visible content cards for featured topics, hot stocks, latest articles, and premium preview modules

## 5. Page-Level Design

## 5.1 Homepage
The homepage should stop rendering module configuration as JSON.

Instead, each module should render actual items:

- featured topics: compact theme cards
- hot stocks: summary cards or rows with symbol, name, change, industry
- latest articles: article list cards with title, excerpt, time
- premium preview: teaser cards for `ts` and `zzd`

The homepage should look like a curated dashboard, not a debug page.

## 5.2 Stock Page
The stock page should contain:

- stock summary card
- daily bars section
- related themes section
- related articles section
- announcements section

Empty sections should be minimized by seeding related data rather than by adding empty-state prose everywhere.

## 5.3 Theme Page
The theme page should contain:

- theme summary card
- associated stock list
- article list
- optional heat/rank snapshot

It should read like a thematic research page rather than a sparse entity view.

## 5.4 Article Page
The article page can stay structurally close to current behavior, but related stocks/themes should be visible and useful. The premium gate remains in place for protected content.

## 5.5 TS / ZZD Pages
These pages remain public teaser/list pages.

They should show:

- title
- source
- published time
- excerpt or teaser text
- entitlement state messaging

If the viewer has the valid premium session, the page may show richer teaser content, but it remains a list page, not a full article body dump.

Teaser-safe rule:
- anonymous viewers must never receive full article bodies from the premium list endpoint
- entitled viewers may receive richer teaser content, but list responses still must not include full article bodies

## 6. API / Server Changes
Only minimal API evolution is allowed:

- `/api/home` may return richer `items` to support content cards
- `/api/articles/premium` may return teaser-safe content for list pages
- no route shape changes

Compatibility rule:
- existing public route paths must not change
- existing public API endpoints must not be removed or renamed
- additive response fields are allowed if needed for richer rendering

Server changes should remain mock/demo oriented and should not leak premium content to anonymous or improperly authenticated users.

## 7. Acceptance Criteria
This enhancement is successful when:

- the homepage visually reads as a product surface, not a config viewer
- stock and theme pages no longer feel empty on the seeded demo dataset
- `TS` and `ZZD` pages show multiple realistic items with visible hierarchy
- all existing public routes remain unchanged
- seeded data is sufficient to demo the product without manual DB edits
- integration tests cover the key display paths and teaser behavior
- the following demo pages are visually populated and usable:
  - `/`
  - `/stock/000001.html`
  - `/theme/18129294.html`
  - `/ts/home`
  - `/zzd/home`

## 8. Risks

### 8.1 Overfitting To Demo Data
If page components assume the exact fixture shape too strongly, later real-data integration gets harder.

Mitigation:
- keep page components driven by existing API contracts
- improve fixture coverage rather than hardcoding page-only fake objects

### 8.2 Regressing Premium Boundaries
More mock content can accidentally leak gated body content into public list pages.

Mitigation:
- keep teaser/list endpoints teaser-safe
- preserve current entitlement checks
- verify with integration tests

## 9. Planning Readiness
This spec is ready for implementation planning if we keep the scope constrained to:

- richer mock data
- homepage/stock/theme/premium-list rendering improvements
- no new architecture or product scope
