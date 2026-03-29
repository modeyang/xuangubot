import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tempDirs = new Set<string>()

function createTempDbPath() {
  const dir = mkdtempSync(join(tmpdir(), 'xgt-scripts-'))
  tempDirs.add(dir)
  return join(dir, 'test.sqlite')
}

function cleanupTempDirs() {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
  tempDirs.clear()
}

function runScript(
  scriptName: string,
  envOverrides: NodeJS.ProcessEnv = {},
): SpawnSyncReturns<string> {
  const env = { ...process.env, ...envOverrides }
  return spawnSync(process.execPath, ['--import', 'tsx', join(projectRoot, 'scripts', scriptName)], {
    cwd: projectRoot,
    env,
    encoding: 'utf8',
  })
}

afterEach(() => {
  cleanupTempDirs()
})

describe('operational scripts', () => {
  it('bootstrap-admin.ts fails non-zero when ADMIN_BOOTSTRAP_PHONE is missing', () => {
    const dbPath = createTempDbPath()
    const env = { DB_PATH: dbPath, ADMIN_BOOTSTRAP_PHONE: '' }

    const result = runScript('bootstrap-admin.ts', env)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('missing ADMIN_BOOTSTRAP_PHONE')
  })

  it('bootstrap-admin.ts is idempotent across reruns', () => {
    const dbPath = createTempDbPath()
    const env = {
      DB_PATH: dbPath,
      ADMIN_BOOTSTRAP_PHONE: '15500000000',
    }

    const first = runScript('bootstrap-admin.ts', env)
    const second = runScript('bootstrap-admin.ts', env)

    expect(first.status).toBe(0)
    expect(second.status).toBe(0)

    const db = new Database(dbPath)
    try {
      const userCount = db
        .prepare(`SELECT COUNT(*) AS count FROM users WHERE phone = ?`)
        .get(env.ADMIN_BOOTSTRAP_PHONE) as { count: number }
      const allowlistCount = db
        .prepare(`SELECT COUNT(*) AS count FROM beta_access_phones WHERE phone = ?`)
        .get(env.ADMIN_BOOTSTRAP_PHONE) as { count: number }
      const user = db
        .prepare(`SELECT role FROM users WHERE phone = ? LIMIT 1`)
        .get(env.ADMIN_BOOTSTRAP_PHONE) as { role: string } | undefined

      expect(userCount.count).toBe(1)
      expect(allowlistCount.count).toBe(1)
      expect(user?.role).toBe('admin')
    } finally {
      db.close()
    }
  })

  it('bootstrap-admin.ts fails when a different admin already exists', () => {
    const dbPath = createTempDbPath()
    const firstEnv = {
      DB_PATH: dbPath,
      ADMIN_BOOTSTRAP_PHONE: '15500000000',
    }
    const secondEnv = {
      DB_PATH: dbPath,
      ADMIN_BOOTSTRAP_PHONE: '15500000001',
    }

    const first = runScript('bootstrap-admin.ts', firstEnv)
    const second = runScript('bootstrap-admin.ts', secondEnv)

    expect(first.status).toBe(0)
    expect(second.status).toBe(1)
    expect(second.stderr).toContain('admin already bootstrapped for different phone')

    const db = new Database(dbPath)
    try {
      const adminRows = db
        .prepare(`SELECT phone, role FROM users WHERE role = 'admin' ORDER BY id ASC`)
        .all() as { phone: string; role: string }[]
      const firstAllowlistCount = db
        .prepare(`SELECT COUNT(*) AS count FROM beta_access_phones WHERE phone = ?`)
        .get(firstEnv.ADMIN_BOOTSTRAP_PHONE) as { count: number }
      const secondAllowlistCount = db
        .prepare(`SELECT COUNT(*) AS count FROM beta_access_phones WHERE phone = ?`)
        .get(secondEnv.ADMIN_BOOTSTRAP_PHONE) as { count: number }

      expect(adminRows).toEqual([{ phone: '15500000000', role: 'admin' }])
      expect(firstAllowlistCount.count).toBe(1)
      expect(secondAllowlistCount.count).toBe(0)
    } finally {
      db.close()
    }
  })

  it('seed scripts stay idempotent on rerun', () => {
    const dbPath = createTempDbPath()
    const env = { DB_PATH: dbPath }

    const planFirst = runScript('seed-plans.ts', env)
    const planSecond = runScript('seed-plans.ts', env)
    const homepageFirst = runScript('seed-homepage.ts', env)
    const homepageSecond = runScript('seed-homepage.ts', env)
    const fixturesFirst = runScript('seed-fixtures.ts', env)
    const fixturesSecond = runScript('seed-fixtures.ts', env)

    expect(planFirst.status).toBe(0)
    expect(planSecond.status).toBe(0)
    expect(homepageFirst.status).toBe(0)
    expect(homepageSecond.status).toBe(0)
    expect(fixturesFirst.status).toBe(0)
    expect(fixturesSecond.status).toBe(0)

    const db = new Database(dbPath)
    try {
      const premiumPlanCount = db
        .prepare(`SELECT COUNT(*) AS count FROM plans WHERE plan_code = 'premium_bundle'`)
        .get() as { count: number }
      const homepageCounts = db
        .prepare(
          `
          SELECT
            COUNT(*) AS totalCount,
            COUNT(DISTINCT module_key) AS distinctCount
          FROM homepage_modules
          WHERE module_key IN ('featured_topics', 'hot_stocks', 'latest_articles', 'premium_teasers')
        `,
        )
        .get() as { totalCount: number; distinctCount: number }
      const stockCount = db
        .prepare(`SELECT COUNT(*) AS count FROM stocks WHERE symbol = '000001'`)
        .get() as { count: number }
      const themeCount = db
        .prepare(`SELECT COUNT(*) AS count FROM themes WHERE id = 18129294`)
        .get() as { count: number }
      const publicArticleCount = db
        .prepare(`SELECT COUNT(*) AS count FROM articles WHERE id = 1261948`)
        .get() as { count: number }
      const premiumArticleCount = db
        .prepare(`SELECT COUNT(*) AS count FROM articles WHERE id = 2260001`)
        .get() as { count: number }

      expect(premiumPlanCount.count).toBe(1)
      expect(homepageCounts.totalCount).toBe(4)
      expect(homepageCounts.distinctCount).toBe(4)
      expect(stockCount.count).toBe(1)
      expect(themeCount.count).toBe(1)
      expect(publicArticleCount.count).toBe(1)
      expect(premiumArticleCount.count).toBe(1)
    } finally {
      db.close()
    }
  }, 15_000)
})
