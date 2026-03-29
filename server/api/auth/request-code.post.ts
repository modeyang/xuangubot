import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { assertRequestCodeAllowed } from '../../utils/rate-limit'
import { generateSmsCode, hashSmsCode, maybeLogSmsCode, persistDebugCode } from '../../utils/mock-sms'
import { createLoginCodeWithRequestIp } from '../../repositories/auth'

function normalizePhone(raw: string) {
  const digits = raw.replaceAll(/\D+/g, '')
  const parsed = z.string().min(8).max(15).safeParse(digits)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid phone' })
  }
  return parsed.data
}

function isNonDevelopment() {
  return process.env.APP_ENV !== 'development'
}

function getRequestIp(event: any) {
  const hdr = event.node.req.headers['x-forwarded-for']
  const forwarded = Array.isArray(hdr) ? hdr[0] : hdr
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]!.trim()
  }
  return event.node.req.socket.remoteAddress ?? null
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
  const parsed = z.object({ phone: z.string().min(1).max(64) }).safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const phone = normalizePhone(parsed.data.phone)

  assertRequestCodeAllowed(event, phone)

  if (isNonDevelopment()) {
    const allowed = await isPhoneAllowed(phone)
    if (!allowed) {
      throw createError({ statusCode: 403, statusMessage: 'not allowlisted' })
    }
  }

  const codePlain = generateSmsCode()
  const codeHash = hashSmsCode(codePlain)
  const requestIp = getRequestIp(event)
  const loginCodeId = await createLoginCodeWithRequestIp(phone, codeHash, requestIp)

  // Admin-observable visibility: store plaintext in login_code_debug, never return it
  // from public auth endpoints.
  await persistDebugCode(loginCodeId, phone, codePlain)
  maybeLogSmsCode(phone, codePlain)

  return { ok: true }
})
