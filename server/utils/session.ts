import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { z } from 'zod'
import { getDb } from './db'

export const SESSION_COOKIE_NAME = 'xgt_session_token'

const SESSION_TTL_DAYS = 30

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(baseIso: string, days: number) {
  const ms = Date.parse(baseIso)
  return new Date(ms + days * 86_400_000).toISOString()
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function base64Url(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function getSessionSecret() {
  // Only allow a default secret in development and test.
  // Any non-development environment must fail fast if SESSION_SECRET is not set.
  const raw = process.env.SESSION_SECRET
  if (raw && raw.trim()) return raw.trim()

  const appEnv = process.env.APP_ENV ?? ''
  const nodeEnv = process.env.NODE_ENV ?? ''

  const dbPath = process.env.DB_PATH ?? ''
  const looksLikeIntegrationTestDb =
    dbPath.includes('xgt-test-') && (dbPath.endsWith('/test.sqlite') || dbPath.endsWith('\\test.sqlite'))

  const allowDefault = appEnv === 'development' || nodeEnv === 'test' || looksLikeIntegrationTestDb
  if (allowDefault) return 'xgt-dev-session-secret'

  throw new Error('missing SESSION_SECRET (required when APP_ENV !== development)')
}

function signToken(token: string) {
  const secret = getSessionSecret()
  return base64Url(createHmac('sha256', secret).update(token, 'utf8').digest())
}

export function encodeSessionCookieValue(sessionToken: string) {
  // Format: <token>.<sig>
  return `${sessionToken}.${signToken(sessionToken)}`
}

export function decodeSessionCookieValue(raw: string | undefined) {
  if (!raw) return null
  const parsed = z.string().min(3).max(512).safeParse(raw)
  if (!parsed.success) return null

  const idx = parsed.data.lastIndexOf('.')
  if (idx <= 0) return null

  const token = parsed.data.slice(0, idx)
  const sig = parsed.data.slice(idx + 1)
  if (!token || !sig) return null

  const expected = signToken(token)
  try {
    const a = Buffer.from(sig, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return token
}

function isSecureCookie() {
  // Only force secure cookies when explicitly running in production.
  // Staging/test/dev typically run over plain HTTP.
  return process.env.APP_ENV === 'production'
}

export async function setSessionCookie(event: H3Event, sessionToken: string, expiresAtIso: string) {
  setCookie(event, SESSION_COOKIE_NAME, encodeSessionCookieValue(sessionToken), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    path: '/',
    expires: new Date(expiresAtIso),
  })
}

export async function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/',
  })
}

export async function createSession(userId: number) {
  const { sqlite } = getDb()
  const createdAt = nowIso()
  const expiresAt = addDaysIso(createdAt, SESSION_TTL_DAYS)

  const sessionToken = base64Url(randomBytes(32))
  const sessionTokenHash = sha256Hex(sessionToken)
  const id = randomUUID()

  sqlite
    .prepare(
      `
      INSERT INTO sessions(id, user_id, session_token_hash, expires_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(id, userId, sessionTokenHash, expiresAt, createdAt)

  return { id, sessionToken, expiresAt }
}

export async function deleteSessionByToken(sessionToken: string) {
  const { sqlite } = getDb()
  const tokenHash = sha256Hex(sessionToken)
  sqlite.prepare(`DELETE FROM sessions WHERE session_token_hash = ?`).run(tokenHash)
}

export type SessionUser = {
  id: number
  phone: string
  role: string
  displayName: string | null
}

export async function getUserFromEventSession(event: H3Event): Promise<SessionUser | null> {
  const raw = getCookie(event, SESSION_COOKIE_NAME)
  const sessionToken = decodeSessionCookieValue(raw)
  if (!sessionToken) return null

  const { sqlite } = getDb()
  const now = nowIso()
  const tokenHash = sha256Hex(sessionToken)

  const row = sqlite
    .prepare(
      `
      SELECT u.id AS id, u.phone AS phone, u.role AS role, u.display_name AS displayName
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?
        AND s.expires_at >= ?
      LIMIT 1
    `,
    )
    .get(tokenHash, now) as SessionUser | undefined

  if (!row) return null

  // Best-effort last seen tracking (do not block auth on this).
  try {
    sqlite
      .prepare(`UPDATE sessions SET last_seen_at = ? WHERE session_token_hash = ?`)
      .run(now, tokenHash)
  } catch {
    // ignore
  }

  return row
}

export const __testOnly = {
  sha256Hex,
}
