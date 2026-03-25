import { defineEventHandler, createError, getQuery, setHeader } from 'h3'
import { z } from 'zod'
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

export default defineEventHandler(async (event) => {
  // Public teaser list only (no entitlement surface in Task 5).
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=300')

  const { type: rawType, limit: rawLimit } = getQuery(event)
  const type = safeType(rawType)
  const limit = safeLimit(rawLimit, 20)

  const rows = await listPremiumArticles(type, limit)
  const articles = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    articleType: a.articleType,
    visibility: a.visibility,
    status: a.status,
    coverUrl: a.coverUrl,
    publishedAt: a.publishedAt,
    sourceName: a.sourceName,
  }))

  return {
    access: { planCode: null as string | null },
    type,
    limit,
    articles,
  }
})

