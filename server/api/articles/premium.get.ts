import { createHash } from 'node:crypto'
import { defineEventHandler, createError, getCookie, getQuery, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { decodeSessionCookieValue } from '../../utils/session'
import { listPremiumArticles } from '../../repositories/articles'

function safeType(raw: unknown) {
  const parsed = z.enum(['ts', 'zzd']).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid type' })
  }
  return parsed.data
}

function safeLimit(raw: unknown, fallback: number) {
  if (raw === undefined) return fallback
  const parsed = z.coerce.number().int().min(1).max(50).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid limit' })
  }
  return parsed.data
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export default defineEventHandler(async (event) => {
  // Response varies by entitlement cookie; do not allow shared caches to store it.
  setHeader(event, 'Cache-Control', 'private, no-store')

  const { type: rawType, limit: rawLimit } = getQuery(event)
  const type = safeType(rawType)
  const limit = safeLimit(rawLimit, 20)
  const sessionToken = decodeSessionCookieValue(getCookie(event, 'xgt_session_token'))
  const { sqlite } = getDb()
  const now = new Date().toISOString()

  const userId = sessionToken
    ? (
        sqlite
          .prepare(
            `
            SELECT user_id AS userId
            FROM sessions
            WHERE session_token_hash = ?
              AND expires_at >= ?
            LIMIT 1
          `,
          )
          .get(sha256Hex(sessionToken), now) as { userId: number } | undefined
      )?.userId ?? null
    : null

  const entitled = userId
    ? Boolean(
        sqlite
          .prepare(
            `
            SELECT 1 AS ok
            FROM entitlements
            WHERE user_id = ?
              AND entitlement_type = 'premium_bundle'
              AND starts_at <= ?
              AND ends_at >= ?
            LIMIT 1
          `,
          )
          .get(userId, now, now),
      )
    : false

  const rows = await listPremiumArticles(type, limit)

  const articles = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: entitled || a.visibility === 'public' ? a.excerpt : null,
    articleType: a.articleType,
    visibility: a.visibility,
    status: a.status,
    coverUrl: a.coverUrl,
    publishedAt: a.publishedAt,
    sourceName: a.sourceName,
    access: {
      allowed: entitled || a.visibility === 'public',
    },
  }))

  return {
    access: { planCode: entitled ? 'premium_bundle' : null, entitled },
    type,
    limit,
    articles,
  }
})
