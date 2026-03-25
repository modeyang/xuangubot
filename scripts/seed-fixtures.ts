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
  // Ensure schema exists for fresh local DBs.
  migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })

  const durationDays = envInt('PREMIUM_PLAN_DURATION_DAYS', 30)
  const priceCents = envInt('PREMIUM_PLAN_PRICE_CENTS', 9900)

  const { sqlite } = getDb()
  const tx = sqlite.transaction(() => {
    // Seed required smoke-check fixtures (idempotent).
    sqlite
      .prepare(
        `
        INSERT INTO stocks(symbol, exchange, name, status, industry, profile_json)
        VALUES ('000001', 'SZ', 'Ping An Bank', 'active', 'banking', NULL)
        ON CONFLICT(symbol) DO UPDATE SET
          exchange = excluded.exchange,
          name = excluded.name,
          status = excluded.status,
          industry = excluded.industry,
          profile_json = excluded.profile_json
      `,
      )
      .run()

    sqlite
      .prepare(
        `
        INSERT INTO themes(id, slug, name, summary, source_ref)
        VALUES (18129294, 'ai', 'AI', 'AI theme', NULL)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          name = excluded.name,
          summary = excluded.summary,
          source_ref = excluded.source_ref
      `,
      )
      .run()

    sqlite
      .prepare(
        `
        INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (
          1261948, 'public-1', 'Public Article', 'excerpt', '# hello', '<h1>hello</h1>',
          'article', 'public', 'published', NULL, '2026-03-25T00:00:00.000Z', 'fixture', NULL
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
      .run()

    // One premium article under zzd (or ts).
    sqlite
      .prepare(
        `
        INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (
          2260001, 'premium-zzd-1', 'Premium ZZD', 'premium excerpt', '# premium', '<h1>premium</h1>',
          'zzd', 'premium', 'published', NULL, '2026-03-25T01:00:00.000Z', 'fixture', NULL
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
      .run()

    // Keep plans in sync with seed-plans (useful for local smoke flows).
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
  })

  tx()

  console.log(
    `[seed-fixtures] seeded fixtures: stock=000001 theme=18129294 article=1261948 premium=2260001`,
  )
}

main().catch((err) => {
  console.error('[seed-fixtures] failed', err)
  process.exit(1)
})

