import { defineEventHandler, getCookie } from 'h3'
import {
  clearSessionCookie,
  decodeSessionCookieValue,
  deleteSessionByToken,
  SESSION_COOKIE_NAME,
} from '../../utils/session'

export default defineEventHandler(async (event) => {
  const raw = getCookie(event, SESSION_COOKIE_NAME)
  const sessionToken = decodeSessionCookieValue(raw)
  if (sessionToken) {
    await deleteSessionByToken(sessionToken)
  }

  await clearSessionCookie(event)
  return { ok: true }
})
