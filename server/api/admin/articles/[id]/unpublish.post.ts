import { defineEventHandler, createError, getRouterParam, setHeader } from 'h3'
import { z } from 'zod'
import { getDb } from '../../../../utils/db'
import { requireAdmin } from '../../../../utils/guards'

function nowIso() {
  return new Date().toISOString()
}

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
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  const admin = await requireAdmin(event)
  const id = safeNumericId(getRouterParam(event, 'id'))

  const { sqlite } = getDb()
  const exists = sqlite
    .prepare(`SELECT id, visibility FROM articles WHERE id = ? LIMIT 1`)
    .get(id) as { id: number; visibility: string } | undefined

  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: `article not found: ${id}` })
  }

  const tx = sqlite.transaction(() => {
    sqlite
      .prepare(
        `
        UPDATE articles
        SET status = 'draft',
            published_at = NULL
        WHERE id = ?
      `,
      )
      .run(id)

    sqlite.prepare(`DELETE FROM search_documents WHERE doc_type = 'article' AND doc_id = ?`).run(String(id))

    sqlite
      .prepare(
        `
        INSERT INTO audit_logs(actor_type, actor_id, action, target_type, target_id, payload_json, created_at)
        VALUES ('user', ?, 'admin.article.unpublish', 'article', ?, NULL, ?)
      `,
      )
      .run(String(admin.id), String(id), nowIso())
  })
  tx()

  return { ok: true, id }
})

