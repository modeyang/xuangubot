import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { createSession, setSessionCookie } from '../../utils/session'
import { assertVerifyCodeAllowed, recordVerifyFailure, recordVerifySuccess } from '../../utils/rate-limit'
import { verifyLoginCode } from '../../repositories/auth'

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

function normalizeCode(raw: string) {
  const digits = raw.replaceAll(/\D+/g, '')
  const parsed = z.string().length(6).safeParse(digits)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid code' })
  }
  return parsed.data
}

function isNonDevelopment() {
  return process.env.APP_ENV !== 'development'
}

async function isPhoneAllowed(phone: string) {
  const { sqlite } = getDb()

  const beta = sqlite
    .prepare(`SELECT enabled FROM beta_access_phones WHERE phone = ? LIMIT 1`)
    .get(phone) as { enabled: 0 | 1 } | undefined

  return Boolean(beta?.enabled)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = z
    .object({
      phone: z.string().min(1).max(64),
      code: z.string().min(1).max(32),
    })
    .safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const phone = normalizePhone(parsed.data.phone)
  const code = normalizeCode(parsed.data.code)

  assertVerifyCodeAllowed(phone)

  if (isNonDevelopment()) {
    const allowed = await isPhoneAllowed(phone)
    if (!allowed) {
      throw createError({ statusCode: 403, statusMessage: 'not allowlisted' })
    }
  }

  const result = await verifyLoginCode(phone, code)
  if (!result.ok) {
    recordVerifyFailure(phone)
    throw createError({ statusCode: 400, statusMessage: 'invalid code' })
  }

  recordVerifySuccess(phone)

  const { sqlite } = getDb()
  const row = sqlite
    .prepare(`SELECT id, phone, role, display_name AS displayName FROM users WHERE phone = ? LIMIT 1`)
    .get(phone) as { id: number; phone: string; role: string; displayName: string | null } | undefined

  let user = row
  if (!user) {
    const createdAt = nowIso()
    const insert = sqlite
      .prepare(
        `
        INSERT INTO users(phone, display_name, role, created_at)
        VALUES (?, NULL, 'user', ?)
      `,
      )
      .run(phone, createdAt)
    user = { id: Number(insert.lastInsertRowid), phone, role: 'user', displayName: null }
  }

  const session = await createSession(user.id)
  await setSessionCookie(event, session.sessionToken, session.expiresAt)

  return {
    ok: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      displayName: user.displayName,
    },
  }
})
