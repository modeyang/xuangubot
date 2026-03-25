import { defineEventHandler, createError, setHeader } from 'h3'
import { getDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  // Plans change rarely; cache longer.
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')

  const { sqlite } = getDb()
  const enabledPlans = sqlite
    .prepare(
      `
      SELECT
        id,
        plan_code AS planCode,
        name,
        duration_days AS durationDays,
        price_cents AS priceCents,
        enabled
      FROM plans
      WHERE enabled = 1
      ORDER BY id ASC
      LIMIT 2
    `,
    )
    .all() as Array<{
    id: number
    planCode: string
    name: string
    durationDays: number
    priceCents: number
    enabled: 0 | 1
  }>

  if (enabledPlans.length === 0) {
    throw createError({ statusCode: 500, statusMessage: 'no enabled plan configured' })
  }
  if (enabledPlans.length > 1) {
    throw createError({ statusCode: 500, statusMessage: 'multiple enabled plans configured' })
  }

  return { plan: enabledPlans[0] }
})
