import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Spec 9.1: Auth and Billing
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull(),
})

export const loginCodes = sqliteTable(
  'login_codes',
  {
    id: integer('id').primaryKey(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    requestIp: text('request_ip'),
  },
  (t) => ({
    phoneExpiresIdx: index('login_codes_phone_expires_at_idx').on(t.phone, t.expiresAt),
  }),
)

// Checklist-required debug table (not part of Spec 9.1 list but referenced by the plan).
// Used only in non-production flows to support visibility of the generated code.
export const loginCodeDebug = sqliteTable('login_code_debug', {
  id: integer('id').primaryKey(),
  loginCodeId: integer('login_code_id').references(() => loginCodes.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull(),
  codePlain: text('code_plain').notNull(),
  createdAt: text('created_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionTokenHash: text('session_token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  lastSeenAt: text('last_seen_at'),
})

export const betaAccessPhones = sqliteTable('beta_access_phones', {
  phone: text('phone').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  createdBy: integer('created_by').references(() => users.id),
})

