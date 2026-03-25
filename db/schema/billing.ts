import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './auth'

// Spec 9.1: Auth and Billing
export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey(),
  planCode: text('plan_code').notNull().unique(),
  name: text('name').notNull(),
  durationDays: integer('duration_days').notNull(),
  priceCents: integer('price_cents').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
})

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: integer('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'restrict' }),
  provider: text('provider').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull(),
  // SQLite UNIQUE allows multiple NULLs, satisfying "unique when present".
  providerOrderId: text('provider_order_id').unique(),
  createdAt: text('created_at').notNull(),
  paidAt: text('paid_at'),
})

export const entitlements = sqliteTable('entitlements', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  entitlementType: text('entitlement_type').notNull(),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  sourceOrderId: integer('source_order_id').references(() => orders.id, { onDelete: 'set null' }),
})

