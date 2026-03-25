import { desc, eq } from 'drizzle-orm'
import { stockDailyBars, stocks } from '../../db/schema'
import { getDb } from '../utils/db'

export async function loadStockBySymbol(symbol: string) {
  const { orm } = getDb()
  return (
    orm
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol))
      .limit(1)
      // better-sqlite3 driver is sync, but we keep an async API boundary.
      .get() ?? null
  )
}

export async function loadStockDailyBars(symbol: string, limit = 30) {
  const { orm } = getDb()

  const stock = await loadStockBySymbol(symbol)
  if (!stock) return []

  return orm
    .select()
    .from(stockDailyBars)
    .where(eq(stockDailyBars.stockId, stock.id))
    .orderBy(desc(stockDailyBars.tradeDate))
    .limit(limit)
    .all()
}

