import { createError, type H3Event } from 'h3'
import { isIP } from 'node:net'

type Counter = { count: number; resetAtMs: number }

function nowMs() {
  return Date.now()
}

function isLoopback(addr: string | undefined) {
  if (!addr) return false
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1'
}

function getIp(event: H3Event) {
  // Default to the direct peer IP. Only consult X-Forwarded-For when we have a local
  // trusted proxy (MVP assumption) and when the header parses as a real IP.
  const peer = event.node.req.socket.remoteAddress ?? undefined

  const hdr = event.node.req.headers['x-forwarded-for']
  const forwarded = Array.isArray(hdr) ? hdr[0] : hdr
  if (isLoopback(peer) && typeof forwarded === 'string') {
    // Guard against pathological header sizes.
    const trimmed = forwarded.slice(0, 256).trim()
    if (trimmed) {
      const candidate = trimmed.split(',')[0]!.trim()
      if (candidate && isIP(candidate)) return candidate
    }
  }

  return peer ?? 'unknown'
}

function bump(map: Map<string, Counter>, key: string, windowMs: number) {
  const now = nowMs()
  const cur = map.get(key)
  if (!cur || cur.resetAtMs <= now) {
    const next = { count: 1, resetAtMs: now + windowMs }
    map.set(key, next)
    return next
  }
  cur.count += 1
  return cur
}

function remainingSec(counter: Counter) {
  return Math.max(1, Math.ceil((counter.resetAtMs - nowMs()) / 1000))
}

// In-memory rate limits are acceptable for MVP (single instance Nitro + SQLite).
const requestCodeByPhone = new Map<string, Counter>()
const requestCodeByIp = new Map<string, Counter>()
const verifyCodeByPhone = new Map<string, Counter>()
const verifyFailByPhone = new Map<string, Counter>()
const verifyLockoutUntilMs = new Map<string, number>()

const WINDOW_10_MIN_MS = 10 * 60_000
const REQUEST_CODE_MAX_PER_PHONE = 5
const REQUEST_CODE_MAX_PER_IP = 20
const VERIFY_MAX_PER_PHONE = 10
const VERIFY_FAIL_LOCKOUT_THRESHOLD = 5
const VERIFY_LOCKOUT_MS = 10 * 60_000

const CLEANUP_INTERVAL_MS = 60_000
let lastCleanupAtMs = 0

function cleanupIfNeeded() {
  const now = nowMs()
  if (now - lastCleanupAtMs < CLEANUP_INTERVAL_MS) return
  lastCleanupAtMs = now

  // Remove stale windows to avoid unbounded growth.
  for (const [k, v] of requestCodeByPhone) if (v.resetAtMs <= now) requestCodeByPhone.delete(k)
  for (const [k, v] of requestCodeByIp) if (v.resetAtMs <= now) requestCodeByIp.delete(k)
  for (const [k, v] of verifyCodeByPhone) if (v.resetAtMs <= now) verifyCodeByPhone.delete(k)
  for (const [k, v] of verifyFailByPhone) if (v.resetAtMs <= now) verifyFailByPhone.delete(k)
  for (const [k, until] of verifyLockoutUntilMs) if (until <= now) verifyLockoutUntilMs.delete(k)
}

export function assertRequestCodeAllowed(event: H3Event, phone: string) {
  cleanupIfNeeded()
  const phoneCounter = bump(requestCodeByPhone, phone, WINDOW_10_MIN_MS)
  if (phoneCounter.count > REQUEST_CODE_MAX_PER_PHONE) {
    throw createError({
      statusCode: 429,
      statusMessage: `rate_limited (retry_after=${remainingSec(phoneCounter)}s)`,
    })
  }

  const ip = getIp(event)
  const ipCounter = bump(requestCodeByIp, ip, WINDOW_10_MIN_MS)
  if (ipCounter.count > REQUEST_CODE_MAX_PER_IP) {
    throw createError({
      statusCode: 429,
      statusMessage: `rate_limited (retry_after=${remainingSec(ipCounter)}s)`,
    })
  }
}

export function assertVerifyCodeAllowed(phone: string) {
  cleanupIfNeeded()
  const lockedUntil = verifyLockoutUntilMs.get(phone)
  const now = nowMs()
  if (lockedUntil && lockedUntil > now) {
    throw createError({
      statusCode: 429,
      statusMessage: `locked (retry_after=${Math.max(1, Math.ceil((lockedUntil - now) / 1000))}s)`,
    })
  }

  const counter = bump(verifyCodeByPhone, phone, WINDOW_10_MIN_MS)
  if (counter.count > VERIFY_MAX_PER_PHONE) {
    throw createError({
      statusCode: 429,
      statusMessage: `rate_limited (retry_after=${remainingSec(counter)}s)`,
    })
  }
}

export function recordVerifyFailure(phone: string) {
  cleanupIfNeeded()
  const counter = bump(verifyFailByPhone, phone, WINDOW_10_MIN_MS)
  if (counter.count >= VERIFY_FAIL_LOCKOUT_THRESHOLD) {
    const until = nowMs() + VERIFY_LOCKOUT_MS
    verifyLockoutUntilMs.set(phone, until)
    // Reset failures so we don't grow unbounded.
    verifyFailByPhone.delete(phone)
    throw createError({
      statusCode: 429,
      statusMessage: `locked (retry_after=${Math.max(1, Math.ceil(VERIFY_LOCKOUT_MS / 1000))}s)`,
    })
  }
}

export function recordVerifySuccess(phone: string) {
  cleanupIfNeeded()
  verifyFailByPhone.delete(phone)
  verifyLockoutUntilMs.delete(phone)
}
