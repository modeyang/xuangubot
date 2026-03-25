import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'

import { getDb } from '../server/utils/db'

function envInt(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function main() {
  migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })

  const durationDays = envInt('PREMIUM_PLAN_DURATION_DAYS', 30)
  const priceCents = envInt('PREMIUM_PLAN_PRICE_CENTS', 9900)

  const { sqlite } = getDb()
  sqlite
    .prepare(
      `
      INSERT INTO plans(plan_code, name, duration_days, price_cents, enabled)
      VALUES ('premium_bundle', 'Premium Bundle', ?, ?, 1)
      ON CONFLICT(plan_code) DO UPDATE SET
        name = excluded.name,
        duration_days = excluded.duration_days,
        price_cents = excluded.price_cents,
        enabled = excluded.enabled
    `,
    )
    .run(durationDays, priceCents)

  console.log(
    `[seed-plans] seeded premium_bundle (duration_days=${durationDays} price_cents=${priceCents})`,
  )
}

main().catch((err) => {
  console.error('[seed-plans] failed', err)
  process.exit(1)
})

