import { defineEventHandler, getRouterParam, setHeader, setResponseStatus } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { loadArticleById } from '../../repositories/articles'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
}

function safeNumericId(raw: unknown) {
  const parsed = z.string().regex(/^[0-9]+$/).safeParse(raw)
  if (!parsed.success) {
    return null
  }
  const id = Number(parsed.data)
  if (!Number.isSafeInteger(id)) {
    return null
  }
  return id
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', PRIVATE_CACHE_HEADERS['Cache-Control'])
  setHeader(event, 'Vary', PRIVATE_CACHE_HEADERS.Vary)

  const id = safeNumericId(getRouterParam(event, 'id'))
  if (id === null) {
    setResponseStatus(event, 400, 'invalid article id')
    return { statusCode: 400, statusMessage: 'invalid article id' }
  }

  const article = await loadArticleById(id)
  if (!article) {
    setResponseStatus(event, 404, `article not found: ${id}`)
    return { statusCode: 404, statusMessage: `article not found: ${id}` }
  }

  // Public read API: unpublished content is not publicly readable.
  // Admin tools can still see draft rows via direct DB access, but the public API should 404.
  if (article.status !== 'published') {
    setResponseStatus(event, 404, `article not found: ${id}`)
    return { statusCode: 404, statusMessage: `article not found: ${id}` }
  }

  // Public read API has no auth surface in Task 4: premium content is not accessible.
  const visibility = article.visibility
  const allowed = visibility === 'public'

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
