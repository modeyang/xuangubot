import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/guards'

function nowIso() {
  return new Date().toISOString()
}

function normalizePhone(raw: string) {
  const digits = raw.replaceAll(/\D+/g, '')
  const parsed = z.string().min(8).max(15).safeParse(digits)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid phone' })
  }
  return parsed.data
}

const BodySchema = z.object({
  action: z.enum(['add', 'enable', 'disable', 'remove']),
  phone: z.string().min(1).max(64),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const phone = normalizePhone(parsed.data.phone)
  const { sqlite } = getDb()

  if (parsed.data.action === 'remove') {
    sqlite.prepare(`DELETE FROM beta_access_phones WHERE phone = ?`).run(phone)
    return { ok: true }
  }

  if (parsed.data.action === 'disable') {
    sqlite.prepare(`UPDATE beta_access_phones SET enabled = 0 WHERE phone = ?`).run(phone)
    return { ok: true }
  }

  if (parsed.data.action === 'enable') {
    sqlite.prepare(`UPDATE beta_access_phones SET enabled = 1 WHERE phone = ?`).run(phone)
    return { ok: true }
  }

  // add: insert or re-enable
  const existing = sqlite
    .prepare(`SELECT phone FROM beta_access_phones WHERE phone = ? LIMIT 1`)
    .get(phone) as { phone: string } | undefined

  if (existing) {
    sqlite.prepare(`UPDATE beta_access_phones SET enabled = 1 WHERE phone = ?`).run(phone)
    return { ok: true, inserted: false }
  }

  sqlite
    .prepare(
      `
      INSERT INTO beta_access_phones(phone, enabled, created_at, created_by)
      VALUES (?, 1, ?, ?)
    `,
    )
    .run(phone, nowIso(), admin.id)

  return { ok: true, inserted: true }
})

