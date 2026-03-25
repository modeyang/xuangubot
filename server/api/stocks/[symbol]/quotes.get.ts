import { defineEventHandler, createError, getQuery, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { loadStockBySymbol } from '../../../repositories/stocks'

const STOCK_QUOTES_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=60'

function safeSymbol(raw: unknown) {
  const parsed = z.string().min(1).max(32).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid stock symbol' })
  }
  return parsed.data
}

function safeLimit(raw: unknown, fallback: number) {
  if (raw === undefined) return fallback

  const schema = z.coerce.number().int().min(1).max(2000)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid limit' })
  }
  return parsed.data
}

export default defineEventHandler(async (event) => {
  const symbol = safeSymbol(getRouterParam(event, 'symbol'))
  const { limit: rawLimit } = getQuery(event)
  const limit = safeLimit(rawLimit, 240)

  setHeader(event, 'Cache-Control', STOCK_QUOTES_CACHE_CONTROL)

  const stock = await loadStockBySymbol(symbol)
  if (!stock) {
    throw createError({ statusCode: 404, statusMessage: `stock not found: ${symbol}` })
  }

  const { sqlite } = getDb()
  const quotes = sqlite
    .prepare(
      `
      SELECT quoted_at AS quotedAt, last_price AS lastPrice, pct_change AS pctChange, turnover, volume
      FROM stock_quotes
      WHERE stock_id = ?
      ORDER BY quoted_at DESC
      LIMIT ?
    `,
    )
    .all(stock.id, limit) as Array<{
    quotedAt: string
    lastPrice: number | null
    pctChange: number | null
    turnover: number | null
    volume: number | null
  }>

  return { symbol, quotes }
})
