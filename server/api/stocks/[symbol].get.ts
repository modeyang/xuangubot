import { defineEventHandler, createError, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { loadStockBySymbol } from '../../repositories/stocks'

const STOCK_SNAPSHOT_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=60'

function safeSymbol(raw: unknown) {
  // Must preserve leading zeroes, so keep as a string.
  const parsed = z.string().min(1).max(32).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid stock symbol' })
  }
  return parsed.data
}

export default defineEventHandler(async (event) => {
  const symbol = safeSymbol(getRouterParam(event, 'symbol'))

  setHeader(event, 'Cache-Control', STOCK_SNAPSHOT_CACHE_CONTROL)

  const stock = await loadStockBySymbol(symbol)
  if (!stock) {
    throw createError({ statusCode: 404, statusMessage: `stock not found: ${symbol}` })
  }

  const { sqlite } = getDb()

  const quote = sqlite
    .prepare(
      `
      SELECT quoted_at AS quotedAt, last_price AS lastPrice, pct_change AS pctChange, turnover, volume
      FROM stock_quotes
      WHERE stock_id = ?
      ORDER BY quoted_at DESC
      LIMIT 1
    `,
    )
    .get(stock.id) as
    | {
        quotedAt: string
        lastPrice: number | null
        pctChange: number | null
        turnover: number | null
        volume: number | null
      }
    | undefined

  const themes = sqlite
    .prepare(
      `
      SELECT
        t.id,
        t.slug,
        t.name,
        t.summary,
        ts.score,
        ts.source
      FROM theme_stocks ts
      JOIN themes t ON t.id = ts.theme_id
      WHERE ts.stock_id = ?
      ORDER BY COALESCE(ts.score, 0) DESC, t.id DESC
      LIMIT 50
    `,
    )
    .all(stock.id) as Array<{
    id: number
    slug: string
    name: string
    summary: string | null
    score: number | null
    source: string | null
  }>

  const articles = sqlite
    .prepare(
      `
      SELECT
        a.id,
        a.slug,
        a.title,
        a.excerpt,
        a.article_type AS articleType,
        a.visibility,
        a.status,
        a.cover_url AS coverUrl,
        a.published_at AS publishedAt,
        a.source_name AS sourceName
      FROM article_stocks s
      JOIN articles a ON a.id = s.article_id
      WHERE s.stock_id = ?
        AND a.status = 'published'
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT 50
    `,
    )
    .all(stock.id) as Array<Record<string, unknown>>

  const announcements = sqlite
    .prepare(
      `
      SELECT
        id,
        title,
        summary,
        published_at AS publishedAt,
        source_name AS sourceName,
        source_url AS sourceUrl
      FROM announcements
      WHERE stock_id = ?
      ORDER BY published_at DESC, id DESC
      LIMIT 50
    `,
    )
    .all(stock.id) as Array<Record<string, unknown>>

  return {
    stock,
    quote: quote ?? null,
    themes,
    articles,
    announcements,
  }
})
