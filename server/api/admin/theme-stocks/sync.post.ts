import { defineEventHandler, createError, readBody, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { requireAdmin } from '../../../utils/guards'

function nowIso() {
  return new Date().toISOString()
}

const BodySchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('correct'),
      themeId: z.number().int().positive(),
      symbols: z.array(z.string().regex(/^[0-9]{6}$/)).min(1).max(500),
      source: z.string().trim().min(1).max(64).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('resync'),
      themeId: z.number().int().positive(),
    })
    .strict(),
])

function extractSymbolsFromSnapshot(payload: unknown) {
  // Best-effort extractor for snapshot payload shapes.
  // Accepts:
  // - { symbols: ["000001", ...] }
  // - { stocks: [{ symbol: "000001" }, { code: "000001" }] }
  // - { list: [{ symbol: "000001" }] }
  if (!payload || typeof payload !== 'object') return []

  const obj = payload as any

  const direct = Array.isArray(obj.symbols) ? obj.symbols : null
  if (direct) {
    return direct
      .map((x: any) => (typeof x === 'string' ? x : ''))
      .map((s: string) => s.trim())
      .filter((s: string) => /^[0-9]{6}$/.test(s))
  }

  const candidates = [obj.stocks, obj.list, obj.items].find((x) => Array.isArray(x)) as any[] | undefined
  if (!candidates) return []

  const out: string[] = []
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue
    const sym = (item as any).symbol ?? (item as any).code ?? (item as any).stockCode ?? null
    if (typeof sym === 'string' && /^[0-9]{6}$/.test(sym.trim())) out.push(sym.trim())
  }
  return out
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  const admin = await requireAdmin(event)

  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const { sqlite } = getDb()

  const theme = sqlite
    .prepare(`SELECT id, slug, name FROM themes WHERE id = ? LIMIT 1`)
    .get(parsed.data.themeId) as { id: number; slug: string; name: string } | undefined

  if (!theme) {
    throw createError({ statusCode: 404, statusMessage: `theme not found: ${parsed.data.themeId}` })
  }

  let symbols: string[] = []
  let source = parsed.data.action === 'correct' ? parsed.data.source ?? 'manual' : 'snapshot'

  if (parsed.data.action === 'correct') {
    symbols = parsed.data.symbols
  } else {
    const snapshot = sqlite
      .prepare(
        `
        SELECT payload_json AS payloadJson
        FROM theme_snapshots
        WHERE theme_id = ?
        ORDER BY captured_at DESC
        LIMIT 1
      `,
      )
      .get(theme.id) as { payloadJson: string | null } | undefined

    if (!snapshot?.payloadJson) {
      throw createError({ statusCode: 400, statusMessage: 'no snapshot payload_json to resync from' })
    }

    let payload: unknown = null
    try {
      payload = JSON.parse(snapshot.payloadJson) as unknown
    } catch {
      payload = null
    }

    symbols = extractSymbolsFromSnapshot(payload)
    if (symbols.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'snapshot payload did not contain symbols' })
    }
  }

  const uniqueSymbols = Array.from(new Set(symbols))

  const stockRows = uniqueSymbols.length
    ? (sqlite
        .prepare(
          `
          SELECT id, symbol
          FROM stocks
          WHERE symbol IN (${uniqueSymbols.map(() => '?').join(',')})
        `,
        )
        .all(...uniqueSymbols) as Array<{ id: number; symbol: string }>)
    : []

  const stockIdBySymbol = new Map(stockRows.map((r) => [r.symbol, r.id]))

  const missing = uniqueSymbols.filter((s) => !stockIdBySymbol.has(s))
  const appliedSymbols = uniqueSymbols.filter((s) => stockIdBySymbol.has(s))

  if (appliedSymbols.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'no valid stock symbols resolved' })
  }

  const tx = sqlite.transaction(() => {
    sqlite.prepare(`DELETE FROM theme_stocks WHERE theme_id = ?`).run(theme.id)

    if (appliedSymbols.length) {
      const stmt = sqlite.prepare(
        `
        INSERT INTO theme_stocks(theme_id, stock_id, score, source)
        VALUES (?, ?, NULL, ?)
      `,
      )
      for (const sym of appliedSymbols) {
        const stockId = stockIdBySymbol.get(sym)
        if (!stockId) continue
        stmt.run(theme.id, stockId, source)
      }
    }

    sqlite
      .prepare(
        `
        INSERT INTO audit_logs(actor_type, actor_id, action, target_type, target_id, payload_json, created_at)
        VALUES ('user', ?, ?, 'theme', ?, ?, ?)
      `,
      )
      .run(
        String(admin.id),
        parsed.data.action === 'correct' ? 'admin.theme_stocks.correct' : 'admin.theme_stocks.resync',
        String(theme.id),
        JSON.stringify({
          theme: { id: theme.id, slug: theme.slug, name: theme.name },
          symbolsRequested: uniqueSymbols,
          symbolsApplied: appliedSymbols,
          missingSymbols: missing,
          source,
        }),
        nowIso(),
      )
  })
  tx()

  return { ok: true, themeId: theme.id, appliedSymbols, missingSymbols: missing, source }
})
