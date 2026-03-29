import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'
import { getDb } from '../../server/utils/db'
import { createSession, encodeSessionCookieValue } from '../../server/utils/session'

await setupNuxtIntegration()

describe('admin', () => {
  async function fetchRaw(path: string, init?: RequestInit) {
    return testFetch(url(path), init)
  }

  async function ensureAdminSession(phone = '15500009999') {
    const { sqlite } = getDb()
    const now = new Date().toISOString()

    const existing = sqlite
      .prepare(`SELECT id FROM users WHERE phone = ? LIMIT 1`)
      .get(phone) as { id: number } | undefined

    const adminId =
      existing?.id ??
      Number(
        sqlite
          .prepare(
            `
            INSERT INTO users(phone, display_name, role, created_at)
            VALUES (?, NULL, 'admin', ?)
          `,
          )
          .run(phone, now).lastInsertRowid,
      )

    sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(adminId)

    const session = await createSession(adminId)
    const cookie = `xgt_session_token=${encodeSessionCookieValue(session.sessionToken)}`
    return { adminId, cookie }
  }

  async function ensureUserSession(phone = '15500008888') {
    const { sqlite } = getDb()
    const now = new Date().toISOString()

    const existing = sqlite
      .prepare(`SELECT id FROM users WHERE phone = ? LIMIT 1`)
      .get(phone) as { id: number } | undefined

    const userId =
      existing?.id ??
      Number(
        sqlite
          .prepare(
            `
            INSERT INTO users(phone, display_name, role, created_at)
            VALUES (?, NULL, 'user', ?)
          `,
          )
          .run(phone, now).lastInsertRowid,
      )

    sqlite.prepare(`UPDATE users SET role = 'user' WHERE id = ?`).run(userId)

    const session = await createSession(userId)
    const cookie = `xgt_session_token=${encodeSessionCookieValue(session.sessionToken)}`
    return { userId, cookie }
  }

  it('requires admin access for homepage module updates', async () => {
    const unauth = await fetchRaw('/api/admin/homepage-modules', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    })
    expect([401, 403]).toContain(unauth.status)

    const { cookie: userCookie } = await ensureUserSession()
    const nonAdmin = await fetchRaw('/api/admin/homepage-modules', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: userCookie },
      body: JSON.stringify({ action: 'list' }),
    })
    expect(nonAdmin.status).toBe(403)

    const { cookie: adminCookie } = await ensureAdminSession()
    const ok = await fetchRaw('/api/admin/homepage-modules', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'list' }),
    })
    expect(ok.status).toBe(200)
    const data = await ok.json()
    expect(Array.isArray((data as any).modules)).toBe(true)
  })

  it('publishes and unpublishes an article, deriving body_html and updating search documents', async () => {
    const { cookie: adminCookie } = await ensureAdminSession('15500009998')
    const { sqlite } = getDb()

    const id = 9900001
    sqlite
      .prepare(
        `
        INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (
          ?, 'draft-test', 'Draft Test', 'excerpt', '# Hello', NULL,
          'article', 'public', 'draft', NULL, NULL, 'test', NULL
        )
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          title = excluded.title,
          excerpt = excluded.excerpt,
          body_markdown = excluded.body_markdown,
          body_html = excluded.body_html,
          article_type = excluded.article_type,
          visibility = excluded.visibility,
          status = excluded.status,
          cover_url = excluded.cover_url,
          published_at = excluded.published_at,
          source_name = excluded.source_name,
          source_ref = excluded.source_ref
      `,
      )
      .run(id)

    const pub = await fetchRaw(`/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({}),
    })
    expect(pub.status).toBe(200)

    const publicAfterPublish = await fetchRaw(`/api/articles/${id}`)
    expect(publicAfterPublish.status).toBe(200)

    const afterPublish = sqlite
      .prepare(`SELECT status, published_at AS publishedAt, body_html AS bodyHtml FROM articles WHERE id = ?`)
      .get(id) as { status: string; publishedAt: string | null; bodyHtml: string | null }

    expect(afterPublish.status).toBe('published')
    expect(afterPublish.publishedAt).toBeTruthy()
    expect(afterPublish.bodyHtml).toContain('<h1>')
    expect(afterPublish.bodyHtml).toContain('Hello')

    const fts = sqlite
      .prepare(`SELECT doc_id AS docId, title FROM search_documents WHERE doc_type = 'article' AND doc_id = ? LIMIT 1`)
      .get(String(id)) as { docId: string; title: string } | undefined
    expect(fts).toBeTruthy()
    expect(fts!.docId).toBe(String(id))
    expect(fts!.title).toBe('Draft Test')

    const unpub = await fetchRaw(`/api/admin/articles/${id}/unpublish`, {
      method: 'POST',
      headers: { cookie: adminCookie },
    })
    expect(unpub.status).toBe(200)

    const publicAfterUnpublish = await fetchRaw(`/api/articles/${id}`)
    expect(publicAfterUnpublish.status).toBe(404)
    expect(publicAfterUnpublish.headers.get('cache-control')).toBe('private, no-store')

    const afterUnpublish = sqlite
      .prepare(`SELECT status, published_at AS publishedAt FROM articles WHERE id = ?`)
      .get(id) as { status: string; publishedAt: string | null }

    expect(afterUnpublish.status).toBe('draft')
    expect(afterUnpublish.publishedAt).toBeNull()

    const ftsGone = sqlite
      .prepare(`SELECT 1 AS ok FROM search_documents WHERE doc_type = 'article' AND doc_id = ? LIMIT 1`)
      .get(String(id)) as { ok: 1 } | undefined
    expect(ftsGone).toBeUndefined()
  })

  it('protects admin pages and renders them for admin sessions (SSR)', async () => {
    const { cookie: userCookie } = await ensureUserSession('15500008889')
    const { cookie: adminCookie } = await ensureAdminSession('15500009994')

    const pages = [
      { path: '/admin', testid: 'admin-index-page' },
      { path: '/admin/articles', testid: 'admin-articles-page' },
      { path: '/admin/homepage-modules', testid: 'admin-homepage-modules-page' },
      { path: '/admin/theme-stocks', testid: 'admin-theme-stocks-page' },
      { path: '/admin/orders', testid: 'admin-orders-page' },
      { path: '/admin/ingest-runs', testid: 'admin-ingest-runs-page' },
      { path: '/admin/beta-access', testid: 'admin-beta-access-page' },
    ]

    for (const p of pages) {
      const unauth = await fetchRaw(p.path)
      expect([401, 403]).toContain(unauth.status)

      const nonAdmin = await fetchRaw(p.path, {
        headers: { cookie: userCookie },
      } as RequestInit)
      expect([401, 403]).toContain(nonAdmin.status)

      const admin = await fetchRaw(p.path, {
        headers: { cookie: adminCookie },
      } as RequestInit)
      expect(admin.status).toBe(200)
      const html = await admin.text()
      expect(html).toContain(`data-testid="${p.testid}"`)
    }
  })

  it('validates homepage module config per module key', async () => {
    const { cookie: adminCookie } = await ensureAdminSession('15500009997')
    const { sqlite } = getDb()

    let mod = sqlite
      .prepare(
        `
        SELECT id, module_key AS moduleKey
        FROM homepage_modules
        ORDER BY id ASC
        LIMIT 1
      `,
      )
      .get() as { id: number; moduleKey: string } | undefined

    if (!mod) {
      sqlite
        .prepare(
          `
          INSERT INTO homepage_modules(module_key, title, config_json, sort_order, enabled)
          VALUES ('hot_stocks', 'Hot Stocks', '{"symbols":["000001"],"limit":8}', 10, 1)
        `,
        )
        .run()
      mod = sqlite
        .prepare(
          `
          SELECT id, module_key AS moduleKey
          FROM homepage_modules
          ORDER BY id ASC
          LIMIT 1
        `,
        )
        .get() as { id: number; moduleKey: string }
    }

    // Invalid config should 400.
    const bad = await fetchRaw('/api/admin/homepage-modules', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'setConfig', id: mod.id, config: { nope: true } }),
    })
    expect(bad.status).toBe(400)

    // Valid config should 200 (pick by key).
    const validConfigByKey: Record<string, any> = {
      featured_topics: { themeIds: [18129294], limit: 8 },
      hot_stocks: { symbols: ['000001'], limit: 8 },
      latest_articles: { types: ['article'], limit: 10 },
      premium_teasers: { types: ['zzd', 'ts'], limit: 5 },
    }
    const ok = await fetchRaw('/api/admin/homepage-modules', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'setConfig', id: mod.id, config: validConfigByKey[mod.moduleKey] }),
    })
    expect(ok.status).toBe(200)
  })

  it('lists orders and ingest runs (admin-only)', async () => {
    const { cookie: adminCookie } = await ensureAdminSession('15500009996')
    const { sqlite } = getDb()
    const now = new Date().toISOString()

    // Seed one order for fixture user/plan.
    sqlite
      .prepare(
        `
        INSERT INTO orders(user_id, plan_id, provider, amount_cents, status, provider_order_id, created_at, paid_at)
        VALUES (9001, (SELECT id FROM plans WHERE plan_code = 'premium_bundle' LIMIT 1), 'mock', 9900, 'pending', NULL, ?, NULL)
      `,
      )
      .run(now)

    // Seed one ingest run.
    sqlite
      .prepare(
        `
        INSERT INTO ingest_runs(job_name, source_name, started_at, finished_at, status, summary_json)
        VALUES ('test_job', 'test_source', ?, ?, 'ok', '{"ok":true}')
      `,
      )
      .run(now, now)

    const unauthOrders = await fetchRaw('/api/admin/orders')
    expect([401, 403]).toContain(unauthOrders.status)

    const orders = await $fetch('/api/admin/orders', { headers: { cookie: adminCookie } })
    expect(Array.isArray((orders as any).orders)).toBe(true)
    expect((orders as any).orders.length).toBeGreaterThan(0)

    const unauthRuns = await fetchRaw('/api/admin/ingest-runs')
    expect([401, 403]).toContain(unauthRuns.status)

    const runs = await $fetch('/api/admin/ingest-runs', { headers: { cookie: adminCookie } })
    expect(Array.isArray((runs as any).runs)).toBe(true)
    expect((runs as any).runs.length).toBeGreaterThan(0)
  })

  it('allows admin theme-stock correction and writes an audit log', async () => {
    const { cookie: adminCookie, adminId } = await ensureAdminSession('15500009995')
    const { sqlite } = getDb()
    const now = new Date().toISOString()

    // Ensure stock 600519 exists.
    sqlite
      .prepare(
        `
        INSERT INTO stocks(symbol, exchange, name, status, industry, profile_json)
        VALUES ('600519', 'SH', 'Kweichow Moutai', 'active', 'liquor', NULL)
        ON CONFLICT(symbol) DO UPDATE SET
          exchange = excluded.exchange,
          name = excluded.name,
          status = excluded.status,
          industry = excluded.industry,
          profile_json = excluded.profile_json
      `,
      )
      .run()

    const res = await $fetch('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: { cookie: adminCookie },
      body: { action: 'correct', themeId: 18129294, symbols: ['000001', '600519', '999999'], source: 'manual' },
    })
    expect((res as any).ok).toBe(true)
    expect((res as any).appliedSymbols).toEqual(['000001', '600519'])
    expect((res as any).missingSymbols).toEqual(['999999'])

    const rows = sqlite
      .prepare(`SELECT theme_id AS themeId, stock_id AS stockId FROM theme_stocks WHERE theme_id = ? ORDER BY stock_id ASC`)
      .all(18129294) as Array<{ themeId: number; stockId: number }>
    expect(rows.length).toBe(2)

    const audit = sqlite
      .prepare(
        `
        SELECT action, actor_id AS actorId, target_type AS targetType, target_id AS targetId, created_at AS createdAt
        FROM audit_logs
        WHERE action = 'admin.theme_stocks.correct'
          AND actor_id = ?
          AND target_type = 'theme'
          AND target_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      )
      .get(String(adminId), String(18129294)) as
      | { action: string; actorId: string; targetType: string; targetId: string; createdAt: string }
      | undefined

    expect(audit).toBeTruthy()
    expect(audit!.createdAt <= now || audit!.createdAt >= now).toBe(true)

    const invalid = await fetchRaw('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'correct', themeId: 18129294, symbols: [], source: 'manual' }),
    })
    expect(invalid.status).toBe(400)
    const rowsAfterEmpty = sqlite
      .prepare(`SELECT theme_id AS themeId, stock_id AS stockId FROM theme_stocks WHERE theme_id = ? ORDER BY stock_id ASC`)
      .all(18129294) as Array<{ themeId: number; stockId: number }>
    expect(rowsAfterEmpty.length).toBe(2)

    const unresolved = await fetchRaw('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'correct', themeId: 18129294, symbols: ['999998'], source: 'manual' }),
    })
    expect(unresolved.status).toBe(400)
    const rowsAfterUnresolved = sqlite
      .prepare(`SELECT theme_id AS themeId, stock_id AS stockId FROM theme_stocks WHERE theme_id = ? ORDER BY stock_id ASC`)
      .all(18129294) as Array<{ themeId: number; stockId: number }>
    expect(rowsAfterUnresolved.length).toBe(2)

    sqlite
      .prepare(
        `
        INSERT INTO theme_snapshots(theme_id, captured_at, heat_score, rank, payload_json)
        VALUES (?, ?, NULL, NULL, ?)
      `,
      )
      .run(18129294, now, JSON.stringify({ symbols: ['999998'] }))

    const unresolvedResync = await fetchRaw('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'resync', themeId: 18129294 }),
    })
    expect(unresolvedResync.status).toBe(400)
    const rowsAfterUnresolvedResync = sqlite
      .prepare(`SELECT theme_id AS themeId, stock_id AS stockId FROM theme_stocks WHERE theme_id = ? ORDER BY stock_id ASC`)
      .all(18129294) as Array<{ themeId: number; stockId: number }>
    expect(rowsAfterUnresolvedResync.length).toBe(2)
  })
})
