import { integer, real, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'

// Spec 9.1: Market and Content
export const stocks = sqliteTable(
  'stocks',
  {
    id: integer('id').primaryKey(),
    symbol: text('symbol').notNull().unique(),
    exchange: text('exchange').notNull(),
    name: text('name'),
    status: text('status'),
    industry: text('industry'),
    profileJson: text('profile_json'),
  },
)

export const stockQuotes = sqliteTable(
  'stock_quotes',
  {
    stockId: integer('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'cascade' }),
    quotedAt: text('quoted_at').notNull(),
    lastPrice: real('last_price'),
    pctChange: real('pct_change'),
    turnover: real('turnover'),
    volume: integer('volume'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.stockId, t.quotedAt] }),
  }),
)

export const stockDailyBars = sqliteTable(
  'stock_daily_bars',
  {
    stockId: integer('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'cascade' }),
    tradeDate: text('trade_date').notNull(),
    open: real('open'),
    high: real('high'),
    low: real('low'),
    close: real('close'),
    volume: integer('volume'),
    turnover: real('turnover'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.stockId, t.tradeDate] }),
  }),
)
