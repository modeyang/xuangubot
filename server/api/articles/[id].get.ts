import { defineEventHandler, createError, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { loadArticleById } from '../../repositories/articles'

function safeNumericId(raw: unknown) {
  const parsed = z.string().regex(/^[0-9]+$/).safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid article id' })
  }
  const id = Number(parsed.data)
  if (!Number.isSafeInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid article id' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  const id = safeNumericId(getRouterParam(event, 'id'))

  const article = await loadArticleById(id)
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: `article not found: ${id}` })
  }

  // Public read API has no auth surface in Task 4: premium content is not accessible.
  const visibility = article.visibility
  const allowed = visibility === 'public'

  setHeader(
    event,
    'Cache-Control',
    allowed
      ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600'
      : 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
  )

  const { sqlite } = getDb()

  const relatedStocks = sqlite
    .prepare(
      `
      SELECT s.id, s.symbol, s.exchange, s.name, s.status, s.industry
      FROM article_stocks a
      JOIN stocks s ON s.id = a.stock_id
      WHERE a.article_id = ?
      ORDER BY s.symbol ASC
    `,
    )
    .all(article.id) as Array<Record<string, unknown>>

  const relatedThemes = sqlite
    .prepare(
      `
      SELECT t.id, t.slug, t.name, t.summary
      FROM article_themes a
      JOIN themes t ON t.id = a.theme_id
      WHERE a.article_id = ?
      ORDER BY t.id DESC
    `,
    )
    .all(article.id) as Array<Record<string, unknown>>

  const redactedArticle = allowed
    ? article
    : {
        ...article,
        bodyMarkdown: null,
        bodyHtml: null,
      }

  return {
    article: redactedArticle,
    access: {
      visibility,
      allowed,
      reason: allowed ? null : 'premium',
    },
    relatedStocks,
    relatedThemes,
  }
})
