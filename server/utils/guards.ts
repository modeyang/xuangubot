import { createError, type H3Event } from 'h3'
import { getUserFromEventSession } from './session'

export async function requireUser(event: H3Event) {
  const user = await getUserFromEventSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'forbidden' })
  }
  return user
}

