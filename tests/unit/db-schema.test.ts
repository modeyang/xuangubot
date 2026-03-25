import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import { DEFAULT_DB_PATH, getDbPath } from '../../db/config'
import * as schema from '../../db/schema'
import { closeDb, getDb } from '../../server/utils/db'

const originalDbPath = process.env.DB_PATH
const tempDirs = new Set<string>()

function createTempDbPath() {
  const dir = mkdtempSync(join(tmpdir(), 'xgt-db-schema-'))
  tempDirs.add(dir)
  return join(dir, 'test.sqlite')
}

function cleanupTempDirs() {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
  tempDirs.clear()
}

afterEach(() => {
  closeDb()
  cleanupTempDirs()

  if (originalDbPath === undefined) {
    delete process.env.DB_PATH
    return
  }

  process.env.DB_PATH = originalDbPath
})

describe('db schema', () => {
  it('exports the full Task 2 MVP table set', () => {
    const requiredTables = [
      'stocks',
      'stockQuotes',
      'stockDailyBars',
      'themes',
      'themeStocks',
      'themeSnapshots',
      'articles',
      'articleStocks',
      'articleThemes',
      'announcements',
      'homepageModules',
      'users',
      'loginCodes',
      'loginCodeDebug',
      'sessions',
      'betaAccessPhones',
      'plans',
      'orders',
      'entitlements',
      'ingestRuns',
      'rawSourceRecords',
      'auditLogs',
    ] as const

    for (const tableName of requiredTables) {
      expect(schema[tableName]).toBeDefined()
    }
  })

  it('keeps only the load-bearing explicit indexes and unique constraints', () => {
    const stocksConfig = getTableConfig(schema.stocks)
    const stockQuotesConfig = getTableConfig(schema.stockQuotes)
    const stockDailyBarsConfig = getTableConfig(schema.stockDailyBars)
    const articlesConfig = getTableConfig(schema.articles)
    const loginCodesConfig = getTableConfig(schema.loginCodes)

    expect(stocksConfig.indexes).toHaveLength(0)
    expect(schema.stocks.symbol.isUnique).toBe(true)
    expect(schema.stocks.symbol.uniqueName).toBe('stocks_symbol_unique')

    // Composite primary keys already create SQLite backing indexes.
    expect(stockQuotesConfig.indexes).toHaveLength(0)
    expect(stockQuotesConfig.primaryKeys).toHaveLength(1)
    expect(stockDailyBarsConfig.indexes).toHaveLength(0)
    expect(stockDailyBarsConfig.primaryKeys).toHaveLength(1)

    expect(articlesConfig.indexes.map((index) => index.config.name)).toContain(
      'articles_published_at_idx',
    )
    expect(loginCodesConfig.indexes.map((index) => index.config.name)).toContain(
      'login_codes_phone_expires_at_idx',
    )
    expect(schema.plans.planCode.isUnique).toBe(true)
    expect(schema.plans.planCode.uniqueName).toBe('plans_plan_code_unique')
    expect(schema.orders.providerOrderId.isUnique).toBe(true)
    expect(schema.orders.providerOrderId.uniqueName).toBe('orders_provider_order_id_unique')
  })

  it('uses a single shared DB path contract', () => {
    delete process.env.DB_PATH

    expect(getDbPath()).toBe(DEFAULT_DB_PATH)
  })

  it('reuses the same sqlite connection for repeated getDb calls on the same path', () => {
    process.env.DB_PATH = createTempDbPath()

    const first = getDb()
    const second = getDb()

    expect(first.sqlite).toBe(second.sqlite)
    expect(first.orm).toBe(second.orm)
  })

  it('opens a fresh sqlite connection when DB_PATH changes', () => {
    process.env.DB_PATH = createTempDbPath()
    const first = getDb()

    process.env.DB_PATH = createTempDbPath()
    const second = getDb()

    expect(first.sqlite).not.toBe(second.sqlite)
    expect(first.orm).not.toBe(second.orm)
  })
})
