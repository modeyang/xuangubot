import { defineEventHandler, setHeader } from 'h3'
import { getUserFromEventSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')
  const user = await getUserFromEventSession(event)
  return { user }
})
