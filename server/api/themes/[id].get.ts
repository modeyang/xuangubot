import { defineEventHandler, createError, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { loadThemeById } from '../../repositories/themes'

function safeNumericId(raw: unknown) {
  const parsed = z.string().regex(/^[0-9]+$/).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid theme id' })
  }
  const id = Number(parsed.data)
  if (!Number.isSafeInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid theme id' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  const id = safeNumericId(getRouterParam(event, 'id'))

  // Theme snapshots are relatively hot during market hours, but can be cached briefly.
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=120')

  const theme = await loadThemeById(id)
  if (!theme) {
    throw createError({ statusCode: 404, statusMessage: `theme not found: ${id}` })
  }

  const { sqlite } = getDb()

  const stocks = sqlite
    .prepare(
      `
      SELECT
        s.id,
        s.symbol,
        s.exchange,
        s.name,
        s.status,
        s.industry,
        s.profile_json AS profileJson,
        ts.score,
        ts.source
      FROM theme_stocks ts
      JOIN stocks s ON s.id = ts.stock_id
      WHERE ts.theme_id = ?
      ORDER BY COALESCE(ts.score, 0) DESC, s.symbol ASC
      LIMIT 200
    `,
    )
    .all(theme.id) as Array<Record<string, unknown>>

  const snapshot = sqlite
    .prepare(
      `
      SELECT
        captured_at AS capturedAt,
        heat_score AS heatScore,
        rank,
        payload_json AS payloadJson
      FROM theme_snapshots
      WHERE theme_id = ?
      ORDER BY captured_at DESC
      LIMIT 1
    `,
    )
    .get(theme.id) as
    | {
        capturedAt: string
        heatScore: number | null
        rank: number | null
        payloadJson: string | null
      }
    | undefined

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
      FROM article_themes t
      JOIN articles a ON a.id = t.article_id
      WHERE t.theme_id = ?
        AND a.status = 'published'
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT 50
    `,
    )
    .all(theme.id) as Array<Record<string, unknown>>

  let snapshotPayload: unknown = null
  if (snapshot?.payloadJson) {
    try {
      snapshotPayload = JSON.parse(snapshot.payloadJson) as unknown
    } catch {
      snapshotPayload = null
    }
  }

  return {
    theme,
    stocks,
    snapshot: snapshot
      ? {
          capturedAt: snapshot.capturedAt,
          heatScore: snapshot.heatScore,
          rank: snapshot.rank,
          payload: snapshotPayload,
        }
      : null,
    articles,
  }
})
