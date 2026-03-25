import { defineEventHandler, createError, getQuery, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../utils/db'

function safeQuery(raw: unknown) {
  const parsed = z.string().trim().safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'missing q' })
  }
  const q = parsed.data
  if (q.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'q must be at least 2 characters' })
  }
  if (q.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'q too long' })
  }
  return q
}

export default defineEventHandler(async (event) => {
  // Search results are user-specific and volatile; avoid aggressive public caching.
  setHeader(event, 'Cache-Control', 'no-store')

  const { q: rawQ } = getQuery(event)
  const q = safeQuery(rawQ)

  const { sqlite } = getDb()

  // Secondary fallback: simple LIKE matches against canonical tables.
  // (Useful during early MVP when search_documents isn't built for all content yet.)
  const like = `%${q}%`
  const stocks = sqlite
    .prepare(
      `
      SELECT id, symbol, exchange, name, status, industry
      FROM stocks
      WHERE symbol LIKE ? OR name LIKE ?
      ORDER BY symbol ASC
      LIMIT 20
    `,
    )
    .all(like, like) as Array<Record<string, unknown>>

  const themes = sqlite
    .prepare(
      `
      SELECT id, slug, name, summary
      FROM themes
      WHERE slug LIKE ? OR name LIKE ? OR summary LIKE ?
      ORDER BY id DESC
      LIMIT 20
    `,
    )
    .all(like, like, like) as Array<Record<string, unknown>>

  const articles = sqlite
    .prepare(
      `
      SELECT id, slug, title, excerpt, article_type AS articleType, published_at AS publishedAt, source_name AS sourceName
      FROM articles
      WHERE status = 'published'
        AND visibility = 'public'
        AND (slug LIKE ? OR title LIKE ? OR excerpt LIKE ?)
      ORDER BY published_at DESC, id DESC
      LIMIT 20
    `,
    )
    .all(like, like, like) as Array<Record<string, unknown>>

  // Contract: grouped arrays directly (no debug wrapper payloads).
  return { stocks, themes, articles }
})
