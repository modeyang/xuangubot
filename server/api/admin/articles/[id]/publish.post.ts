import { defineEventHandler, createError, getRouterParam, readBody, setHeader } from 'h3'
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

function escapeHtml(raw: string) {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Minimal Markdown renderer for admin-publish pipeline.
// Goal: deterministic and dependency-free HTML output.
function markdownToHtml(md: string) {
  const lines = md.replaceAll('\r\n', '\n').split('\n')

  let inCode = false
  let codeBuf: string[] = []
  let listBuf: string[] = []
  let out: string[] = []

  function flushList() {
    if (listBuf.length === 0) return
    const items = listBuf.map((x) => `<li>${escapeHtml(x)}</li>`).join('')
    out.push(`<ul>${items}</ul>`)
    listBuf = []
  }

  function flushCode() {
    if (codeBuf.length === 0) return
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`)
    codeBuf = []
  }

  for (const rawLine of lines) {
    const line = rawLine ?? ''
    if (line.trim().startsWith('```')) {
      if (inCode) {
        // closing fence
        inCode = false
        flushCode()
      } else {
        // opening fence
        flushList()
        inCode = true
        codeBuf = []
      }
      continue
    }

    if (inCode) {
      codeBuf.push(line)
      continue
    }

    const trimmed = line.trim()
    if (trimmed.length === 0) {
      flushList()
      continue
    }

    const h = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flushList()
      const level = h[1]!.length
      out.push(`<h${level}>${escapeHtml(h[2]!.trim())}</h${level}>`)
      continue
    }

    const li = trimmed.match(/^-\s+(.*)$/)
    if (li) {
      listBuf.push(li[1]!.trim())
      continue
    }

    flushList()
    out.push(`<p>${escapeHtml(trimmed)}</p>`)
  }

  if (inCode) flushCode()
  flushList()

  return out.join('\n')
}

const BodySchema = z
  .object({
    // Optional override; default is "now" when missing.
    publishedAt: z.string().datetime().optional(),
  })
  .strict()

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  const admin = await requireAdmin(event)
  const id = safeNumericId(getRouterParam(event, 'id'))

  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body ?? {})
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const { sqlite } = getDb()
  const row = sqlite
    .prepare(
      `
      SELECT id, slug, title, excerpt, body_markdown AS bodyMarkdown, visibility
      FROM articles
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(id) as
    | {
        id: number
        slug: string
        title: string
        excerpt: string | null
        bodyMarkdown: string | null
        visibility: string
      }
    | undefined

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: `article not found: ${id}` })
  }

  const bodyMarkdown = row.bodyMarkdown ?? ''
  const bodyHtml = markdownToHtml(bodyMarkdown)
  const publishedAt = parsed.data.publishedAt ?? nowIso()

  const tx = sqlite.transaction(() => {
    sqlite
      .prepare(
        `
        UPDATE articles
        SET status = 'published',
            published_at = ?,
            body_html = ?
        WHERE id = ?
      `,
      )
      .run(publishedAt, bodyHtml, row.id)

    // FTS visibility: only public + published should be searchable.
    sqlite.prepare(`DELETE FROM search_documents WHERE doc_type = 'article' AND doc_id = ?`).run(String(row.id))

    if (row.visibility === 'public') {
      sqlite
        .prepare(
          `
          INSERT INTO search_documents(doc_type, doc_id, title, body, keywords)
          VALUES ('article', ?, ?, ?, ?)
        `,
        )
        .run(String(row.id), row.title, bodyMarkdown, row.slug)
    }

    sqlite
      .prepare(
        `
        INSERT INTO audit_logs(actor_type, actor_id, action, target_type, target_id, payload_json, created_at)
        VALUES ('user', ?, 'admin.article.publish', 'article', ?, ?, ?)
      `,
      )
      .run(String(admin.id), String(row.id), JSON.stringify({ publishedAt }), nowIso())
  })
  tx()

  return { ok: true, id, publishedAt }
})

