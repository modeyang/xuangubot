import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'

import { getDb } from '../server/utils/db'

type ModuleSeed = {
  moduleKey: string
  title: string
  sortOrder: number
  enabled: 0 | 1
  config: unknown
}

async function main() {
  migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })

  const seeds: ModuleSeed[] = [
    {
      moduleKey: 'featured_topics',
      title: 'Featured Topics',
      sortOrder: 10,
      enabled: 1,
      config: { themeIds: [18129294], limit: 8 },
    },
    {
      moduleKey: 'hot_stocks',
      title: 'Hot Stocks',
      sortOrder: 20,
      enabled: 1,
      config: { symbols: ['000001', '600519', '000333'], limit: 8 },
    },
    {
      moduleKey: 'latest_articles',
      title: 'Latest Articles',
      sortOrder: 30,
      enabled: 1,
      config: { types: ['article'], limit: 10 },
    },
    {
      moduleKey: 'premium_teasers',
      title: 'Premium (Preview)',
      sortOrder: 40,
      enabled: 1,
      config: { types: ['zzd', 'ts'], limit: 5 },
    },
  ]

  const { sqlite } = getDb()
  const tx = sqlite.transaction(() => {
    const keys = seeds.map((s) => s.moduleKey)
    const placeholders = keys.map(() => '?').join(',')
    sqlite.prepare(`DELETE FROM homepage_modules WHERE module_key IN (${placeholders})`).run(...keys)

    const stmt = sqlite.prepare(
      `
      INSERT INTO homepage_modules(module_key, title, config_json, sort_order, enabled)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    for (const seed of seeds) {
      stmt.run(seed.moduleKey, seed.title, JSON.stringify(seed.config), seed.sortOrder, seed.enabled)
    }
  })
  tx()

  console.log(`[seed-homepage] seeded ${seeds.length} homepage modules`)
}

main().catch((err) => {
  console.error('[seed-homepage] failed', err)
  process.exit(1)
})

