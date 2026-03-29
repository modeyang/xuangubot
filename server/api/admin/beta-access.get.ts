import { defineEventHandler, setHeader } from 'h3'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/guards'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')
  await requireAdmin(event)
  const { sqlite } = getDb()

  const phones = sqlite
    .prepare(
      `
      SELECT phone, enabled, created_at AS createdAt, created_by AS createdBy
      FROM beta_access_phones
      ORDER BY created_at DESC, phone ASC
    `,
    )
    .all() as Array<{ phone: string; enabled: 0 | 1; createdAt: string; createdBy: number | null }>

  const debugCodes = sqlite
    .prepare(
      `
      SELECT d.phone AS phone, d.code_plain AS codePlain, d.created_at AS createdAt
      FROM login_code_debug d
      JOIN (
        SELECT phone, MAX(created_at) AS maxCreatedAt
        FROM login_code_debug
        GROUP BY phone
      ) latest
        ON latest.phone = d.phone
       AND latest.maxCreatedAt = d.created_at
      ORDER BY d.created_at DESC
      LIMIT 200
    `,
    )
    .all() as Array<{ phone: string; codePlain: string; createdAt: string }>

  return { phones, debugCodes }
})
