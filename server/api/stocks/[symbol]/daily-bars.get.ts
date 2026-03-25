import { defineEventHandler, createError, getQuery, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { loadStockDailyBars, loadStockBySymbol } from '../../../repositories/stocks'

const DAILY_BARS_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'

function safeSymbol(raw: unknown) {
  const parsed = z.string().min(1).max(32).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid stock symbol' })
  }
  return parsed.data
}

function safeLimit(raw: unknown, fallback: number) {
  if (raw === undefined) return fallback

  const schema = z.coerce.number().int().min(1).max(3650)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid limit' })
  }
  return parsed.data
}

export default defineEventHandler(async (event) => {
  const symbol = safeSymbol(getRouterParam(event, 'symbol'))
  const { limit: rawLimit } = getQuery(event)
  const limit = safeLimit(rawLimit, 120)

  setHeader(event, 'Cache-Control', DAILY_BARS_CACHE_CONTROL)

  const stock = await loadStockBySymbol(symbol)
  if (!stock) {
    throw createError({ statusCode: 404, statusMessage: `stock not found: ${symbol}` })
  }

  const dailyBars = await loadStockDailyBars(symbol, limit)
  return { symbol, dailyBars }
})
