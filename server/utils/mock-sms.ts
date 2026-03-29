import { createHash, randomInt } from 'node:crypto'
import { getDb } from './db'

function nowIso() {
  return new Date().toISOString()
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function generateSmsCode() {
  // 6-digit numeric code
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashSmsCode(code: string) {
  return sha256Hex(code)
}

export async function persistDebugCode(loginCodeId: number, phone: string, codePlain: string) {
  const { sqlite } = getDb()
  sqlite
    .prepare(
      `
      INSERT INTO login_code_debug(login_code_id, phone, code_plain, created_at)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(loginCodeId, phone, codePlain, nowIso())
}

export function maybeLogSmsCode(phone: string, codePlain: string) {
  // Debug visibility is allowed in development and staging.
  if (process.env.APP_ENV === 'development' || process.env.APP_ENV === 'staging') {
    // eslint-disable-next-line no-console
    console.log(`[mock-sms] code for ${phone}: ${codePlain}`)
  }
}

