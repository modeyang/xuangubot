import { index, integer, real, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { stocks } from './market'

// Spec 9.1: Market and Content
export const themes = sqliteTable('themes', {
  // IDs align to legacy public IDs. Do not force autoincrement.
  id: integer('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  summary: text('summary'),
  sourceRef: text('source_ref'),
})

export const themeStocks = sqliteTable(
  'theme_stocks',
  {
    themeId: integer('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    stockId: integer('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'cascade' }),
    score: real('score'),
    source: text('source'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.themeId, t.stockId] }),
  }),
)

export const themeSnapshots = sqliteTable(
  'theme_snapshots',
  {
    themeId: integer('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    capturedAt: text('captured_at').notNull(),
    heatScore: real('heat_score'),
    rank: integer('rank'),
    payloadJson: text('payload_json'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.themeId, t.capturedAt] }),
  }),
)

export const articles = sqliteTable(
  'articles',
  {
    // IDs align to legacy public IDs. Do not force autoincrement.
    id: integer('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    bodyMarkdown: text('body_markdown'),
    bodyHtml: text('body_html'),
    articleType: text('article_type').notNull(),
    visibility: text('visibility').notNull(),
    status: text('status').notNull(),
    coverUrl: text('cover_url'),
    publishedAt: text('published_at'),
    sourceName: text('source_name'),
    sourceRef: text('source_ref'),
  },
  (t) => ({
    publishedAtIdx: index('articles_published_at_idx').on(t.publishedAt),
  }),
)

export const articleStocks = sqliteTable(
  'article_stocks',
  {
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    stockId: integer('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.stockId] }),
  }),
)

export const articleThemes = sqliteTable(
  'article_themes',
  {
    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    themeId: integer('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.themeId] }),
  }),
)

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  publishedAt: text('published_at'),
  sourceName: text('source_name'),
  sourceUrl: text('source_url'),
})

// Spec 9.1: Homepage and Search
export const homepageModules = sqliteTable('homepage_modules', {
  id: integer('id').primaryKey(),
  moduleKey: text('module_key').notNull(),
  title: text('title').notNull(),
  configJson: text('config_json'),
  sortOrder: integer('sort_order'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
})

