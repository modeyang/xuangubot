import { createHash } from 'node:crypto'
import { getDb } from '../utils/db'

const LOGIN_CODE_TTL_MINUTES = 10

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function nowIso() {
  return new Date().toISOString()
}

function addMinutesIso(baseIso: string, minutes: number) {
  const ms = Date.parse(baseIso)
  return new Date(ms + minutes * 60_000).toISOString()
}

export async function createLoginCode(phone: string, codeHash: string) {
  const { sqlite } = getDb()

  const createdAt = nowIso()
  const expiresAt = addMinutesIso(createdAt, LOGIN_CODE_TTL_MINUTES)

  const result = sqlite
    .prepare(
      `
      INSERT INTO login_codes(phone, code_hash, expires_at, used_at, request_ip)
      VALUES (?, ?, ?, NULL, ?)
    `,
    )
    .run(phone, codeHash, expiresAt, null)

  return Number(result.lastInsertRowid)
}

export async function createLoginCodeWithRequestIp(phone: string, codeHash: string, requestIp: string | null) {
  const { sqlite } = getDb()

  const createdAt = nowIso()
  const expiresAt = addMinutesIso(createdAt, LOGIN_CODE_TTL_MINUTES)

  const result = sqlite
    .prepare(
      `
      INSERT INTO login_codes(phone, code_hash, expires_at, used_at, request_ip)
      VALUES (?, ?, ?, NULL, ?)
    `,
    )
    .run(phone, codeHash, expiresAt, requestIp)

  return Number(result.lastInsertRowid)
}

export async function verifyLoginCode(phone: string, code: string) {
  const { sqlite } = getDb()

  const now = nowIso()
  const actualHash = sha256Hex(code)
  const row = sqlite
    .prepare(
      `
      UPDATE login_codes
      SET used_at = ?
      WHERE id = (
        SELECT id
        FROM login_codes
        WHERE phone = ?
          AND expires_at > ?
          AND used_at IS NULL
        ORDER BY expires_at DESC, id DESC
        LIMIT 1
      )
        AND code_hash = ?
        AND used_at IS NULL
      RETURNING id
    `,
    )
    .get(now, phone, now, actualHash) as { id: number } | undefined

  if (!row) return { ok: false as const }

  return { ok: true as const, loginCodeId: row.id }
}

export const __testOnly = {
  sha256Hex,
}
