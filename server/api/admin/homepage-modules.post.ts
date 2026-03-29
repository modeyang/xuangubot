import { defineEventHandler, createError, readBody, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/guards'

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'invalid config (not JSON-serializable)' })
  }
}

function safeModuleConfig(moduleKey: string, raw: unknown) {
  const featuredTopicsSchema = z
    .object({
      themeIds: z.array(z.number().int().positive()).min(1).max(200),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict()

  const hotStocksSchema = z
    .object({
      symbols: z
        .array(z.string().regex(/^[0-9]{6}$/))
        .min(1)
        .max(200),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict()

  const latestArticlesSchema = z
    .object({
      types: z.array(z.enum(['article', 'ts', 'zzd'])).min(1).max(3),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict()

  const premiumTeasersSchema = z
    .object({
      types: z.array(z.enum(['ts', 'zzd'])).min(1).max(2),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict()

  const map: Record<string, z.ZodTypeAny> = {
    featured_topics: featuredTopicsSchema,
    hot_stocks: hotStocksSchema,
    latest_articles: latestArticlesSchema,
    premium_teasers: premiumTeasersSchema,
  }

  const schema = map[moduleKey]
  if (!schema) {
    throw createError({ statusCode: 400, statusMessage: `unknown moduleKey: ${moduleKey}` })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: `invalid config for ${moduleKey}` })
  }

  return parsed.data
}

const BodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z
    .object({
      action: z.literal('setEnabled'),
      id: z.number().int().positive(),
      enabled: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal('setTitle'),
      id: z.number().int().positive(),
      title: z.string().trim().min(1).max(200),
    })
    .strict(),
  z
    .object({
      action: z.literal('setConfig'),
      id: z.number().int().positive(),
      config: z.unknown(),
    })
    .strict(),
  z
    .object({
      action: z.literal('reorder'),
      orderedIds: z.array(z.number().int().positive()).min(1).max(500),
    })
    .strict(),
])

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const { sqlite } = getDb()

  function listAll() {
    const rows = sqlite
      .prepare(
        `
        SELECT
          id,
          module_key AS moduleKey,
          title,
          config_json AS configJson,
          sort_order AS sortOrder,
          enabled
        FROM homepage_modules
        ORDER BY COALESCE(sort_order, 0) ASC, id ASC
      `,
      )
      .all() as Array<{
      id: number
      moduleKey: string
      title: string
      configJson: string | null
      sortOrder: number | null
      enabled: 0 | 1
    }>

    return {
      modules: rows.map((r) => ({
        ...r,
        enabled: Boolean(r.enabled),
      })),
    }
  }

  if (parsed.data.action === 'list') {
    return listAll()
  }

  if (parsed.data.action === 'setEnabled') {
    sqlite
      .prepare(`UPDATE homepage_modules SET enabled = ? WHERE id = ?`)
      .run(parsed.data.enabled ? 1 : 0, parsed.data.id)
    return listAll()
  }

  if (parsed.data.action === 'setTitle') {
    sqlite.prepare(`UPDATE homepage_modules SET title = ? WHERE id = ?`).run(parsed.data.title, parsed.data.id)
    return listAll()
  }

  if (parsed.data.action === 'setConfig') {
    const row = sqlite
      .prepare(`SELECT id, module_key AS moduleKey FROM homepage_modules WHERE id = ? LIMIT 1`)
      .get(parsed.data.id) as { id: number; moduleKey: string } | undefined

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `module not found: ${parsed.data.id}` })
    }

    const normalized = safeModuleConfig(row.moduleKey, parsed.data.config)
    const configJson = safeJsonStringify(normalized)
    sqlite.prepare(`UPDATE homepage_modules SET config_json = ? WHERE id = ?`).run(configJson, row.id)
    return listAll()
  }

  // reorder
  const orderedIds = parsed.data.orderedIds
  const tx = sqlite.transaction(() => {
    // Assign stable spaced sort orders, leaving room for manual inserts later.
    const stmt = sqlite.prepare(`UPDATE homepage_modules SET sort_order = ? WHERE id = ?`)
    for (let i = 0; i < orderedIds.length; i += 1) {
      stmt.run((i + 1) * 10, orderedIds[i]!)
    }
  })
  tx()

  return listAll()
})

