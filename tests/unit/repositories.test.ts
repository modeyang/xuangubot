import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { closeDb, getDb } from '../../server/utils/db'
import { loadStockBySymbol } from '../../server/repositories/stocks'
import { loadStockDailyBars } from '../../server/repositories/stocks'
import { loadThemeById } from '../../server/repositories/themes'
import { loadArticleById, listPremiumArticles } from '../../server/repositories/articles'
import { loadHomeModules } from '../../server/repositories/homepage'
import { __testOnly, createLoginCode, verifyLoginCode } from '../../server/repositories/auth'
import { completeMockPayment, createOrder } from '../../server/repositories/billing'

describe('repositories', () => {
  const originalDbPath = process.env.DB_PATH
  const tempDirs = new Set<string>()

  function createTempDbPath() {
    const dir = mkdtempSync(join(tmpdir(), 'xgt-repos-'))
    tempDirs.add(dir)
    return join(dir, 'test.sqlite')
  }

  function cleanupTempDirs() {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.clear()
  }

  async function prepareDb() {
    process.env.DB_PATH = createTempDbPath()
    // Drizzle migration runner expects the same folder structure as drizzle-kit.
    migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })
  }

  afterEach(() => {
    closeDb()
    cleanupTempDirs()
    if (originalDbPath === undefined) delete process.env.DB_PATH
    else process.env.DB_PATH = originalDbPath
  })

  it('can load a stock by symbol', async () => {
    expect(typeof loadStockBySymbol).toBe('function')
  })

  it('loads stock rows and daily bars', async () => {
    await prepareDb()
    const { sqlite } = getDb()

    const stockRes = sqlite
      .prepare(
        `INSERT INTO stocks(symbol, exchange, name, status, industry, profile_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run('000001', 'SZ', 'Ping An Bank', 'active', 'banking', null)
    const stockId = Number(stockRes.lastInsertRowid)

    sqlite
      .prepare(
        `INSERT INTO stock_daily_bars(stock_id, trade_date, open, high, low, close, volume, turnover)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(stockId, '2026-03-24', 10, 11, 9, 10.5, 1000, 123.45)
    sqlite
      .prepare(
        `INSERT INTO stock_daily_bars(stock_id, trade_date, open, high, low, close, volume, turnover)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(stockId, '2026-03-25', 10.5, 12, 10, 11.8, 2000, 234.56)

    const stock = await loadStockBySymbol('000001')
    expect(stock?.id).toBe(stockId)

    const bars = await loadStockDailyBars('000001', 1)
    expect(bars).toHaveLength(1)
    expect(bars[0]?.tradeDate).toBe('2026-03-25')
  })

  it('loads themes and articles and lists premium articles', async () => {
    await prepareDb()
    const { sqlite } = getDb()

    sqlite
      .prepare(`INSERT INTO themes(id, slug, name, summary, source_ref) VALUES (?, ?, ?, ?, ?)`)
      .run(18129294, 'ai', 'AI', 'AI theme', null)

    sqlite
      .prepare(
        `INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        1261948,
        'public-1',
        'Public Article',
        'excerpt',
        '# hello',
        '<h1>hello</h1>',
        'article',
        'public',
        'published',
        null,
        '2026-03-25T00:00:00.000Z',
        'fixture',
        null,
      )

    sqlite
      .prepare(
        `INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        2260001,
        'premium-zzd-1',
        'Premium ZZD',
        'premium excerpt',
        '# premium',
        '<h1>premium</h1>',
        'zzd',
        'premium',
        'published',
        null,
        '2026-03-25T01:00:00.000Z',
        'fixture',
        null,
      )

    const theme = await loadThemeById(18129294)
    expect(theme?.name).toBe('AI')

    const article = await loadArticleById(1261948)
    expect(article?.visibility).toBe('public')

    const premium = await listPremiumArticles('zzd', 10)
    expect(premium.some((a) => a.id === 2260001)).toBe(true)
  })

  it('loads enabled homepage modules in sort order', async () => {
    await prepareDb()
    const { sqlite } = getDb()

    sqlite
      .prepare(
        `INSERT INTO homepage_modules(module_key, title, config_json, sort_order, enabled)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('b', 'B', '{}', 2, 1)
    sqlite
      .prepare(
        `INSERT INTO homepage_modules(module_key, title, config_json, sort_order, enabled)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('a', 'A', '{}', 1, 1)
    sqlite
      .prepare(
        `INSERT INTO homepage_modules(module_key, title, config_json, sort_order, enabled)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('disabled', 'X', '{}', 0, 0)

    const modules = await loadHomeModules()
    expect(modules.map((m) => m.moduleKey)).toEqual(['a', 'b'])
  })

  it('creates and verifies login codes', async () => {
    await prepareDb()
    const { sqlite } = getDb()
    const phone = '15500000000'
    const code = '123456'
    const codeHash = __testOnly.sha256Hex(code)

    const id = await createLoginCode(phone, codeHash)
    expect(typeof id).toBe('number')

    const wrong = await verifyLoginCode(phone, '000000')
    expect(wrong.ok).toBe(false)

    const ok = await verifyLoginCode(phone, code)
    expect(ok.ok).toBe(true)
    expect(ok).toEqual({ ok: true, loginCodeId: id })

    const secondTry = await verifyLoginCode(phone, code)
    expect(secondTry.ok).toBe(false)

    const usedCount = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM login_codes WHERE phone = ? AND used_at IS NOT NULL`)
      .get(phone) as { count: number }
    expect(usedCount.count).toBe(1)
  })

  it('creates orders and completes mock payments idempotently', async () => {
    await prepareDb()
    const { sqlite } = getDb()

    const userRes = sqlite
      .prepare(
        `INSERT INTO users(phone, display_name, role, created_at) VALUES (?, ?, ?, ?)`,
      )
      .run('15500000001', 'Test', 'user', new Date().toISOString())
    const userId = Number(userRes.lastInsertRowid)

    sqlite
      .prepare(
        `INSERT INTO plans(plan_code, name, duration_days, price_cents, enabled)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run('premium_bundle', 'Premium Bundle', 30, 9900, 1)

    const order = await createOrder(userId, 'premium_bundle')
    expect(order.id).toBeGreaterThan(0)

    const result = await completeMockPayment(order.id, userId)
    expect(result.ok).toBe(true)

    const secondResult = await completeMockPayment(order.id, userId)
    expect(secondResult.ok).toBe(true)

    const entitlement = sqlite
      .prepare(`SELECT id, entitlement_type AS entitlementType FROM entitlements WHERE user_id = ?`)
      .get(userId) as { id: number; entitlementType: string } | undefined
    expect(entitlement?.entitlementType).toBe('premium_bundle')

    const entitlementCount = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM entitlements WHERE source_order_id = ?`)
      .get(order.id) as { count: number }
    expect(entitlementCount.count).toBe(1)

    const auditCount = sqlite
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM audit_logs
        WHERE action = 'billing.complete_mock_payment'
          AND target_type = 'order'
          AND target_id = ?
      `,
      )
      .get(String(order.id)) as { count: number }
    expect(auditCount.count).toBe(1)
  })
})
