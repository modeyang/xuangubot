import { createHash } from 'node:crypto'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'

import { getDb } from '../server/utils/db'

function envInt(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

async function main() {
  // Ensure schema exists for fresh local DBs.
  migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })

  const durationDays = envInt('PREMIUM_PLAN_DURATION_DAYS', 30)
  const priceCents = envInt('PREMIUM_PLAN_PRICE_CENTS', 9900)
  const now = new Date()
  const startsAt = new Date(now.getTime() - 60_000).toISOString()
  const endsAt = new Date(now.getTime() + durationDays * 86_400_000).toISOString()

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
          2260003, 'premium-ts-older', 'Premium TS Older', 'older ts premium excerpt', '# ts older', '<h1>ts older</h1>',
          'ts', 'premium', 'published', NULL, '2026-03-24T23:00:00.000Z', 'fixture', NULL
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

    sqlite
      .prepare(
        `
        INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (
          2260004, 'premium-zzd-older', 'Premium ZZD Older', 'older premium excerpt', '# zzd older', '<h1>zzd older</h1>',
          'zzd', 'premium', 'published', NULL, '2026-03-24T22:00:00.000Z', 'fixture', NULL
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

    sqlite
      .prepare(
        `
        INSERT INTO articles(
          id, slug, title, excerpt, body_markdown, body_html,
          article_type, visibility, status, cover_url, published_at, source_name, source_ref
        ) VALUES (
          2260002, 'premium-ts-1', 'Premium TS', 'ts premium excerpt', '# ts premium', '<h1>ts premium</h1>',
          'ts', 'premium', 'published', NULL, '2026-03-25T02:00:00.000Z', 'fixture', NULL
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

    sqlite
      .prepare(
        `
        INSERT INTO users(id, phone, display_name, role, created_at)
        VALUES (9001, '15500009001', 'Premium Fixture', 'user', ?)
        ON CONFLICT(id) DO UPDATE SET
          phone = excluded.phone,
          display_name = excluded.display_name,
          role = excluded.role
      `,
      )
      .run(now.toISOString())

    sqlite
      .prepare(
        `
        INSERT INTO sessions(id, user_id, session_token_hash, expires_at, last_seen_at)
        VALUES ('fixture-premium-session', 9001, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          session_token_hash = excluded.session_token_hash,
          expires_at = excluded.expires_at,
          last_seen_at = excluded.last_seen_at
      `,
      )
      .run(sha256Hex('fixture-premium-token'), endsAt, now.toISOString())

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

    sqlite
      .prepare(
        `
        DELETE FROM entitlements
        WHERE user_id = 9001
          AND entitlement_type = 'premium_bundle'
      `,
      )
      .run()

    sqlite
      .prepare(
        `
        INSERT INTO entitlements(user_id, entitlement_type, starts_at, ends_at, source_order_id)
        VALUES (9001, 'premium_bundle', ?, ?, NULL)
      `,
      )
      .run(startsAt, endsAt)
  })

  tx()

  console.log(
    `[seed-fixtures] seeded fixtures: stock=000001 theme=18129294 article=1261948 premium=2260001,2260002,2260003,2260004 user=9001`,
  )
}

main().catch((err) => {
  console.error('[seed-fixtures] failed', err)
  process.exit(1)
})
