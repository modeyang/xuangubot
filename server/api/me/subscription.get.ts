import { defineEventHandler } from 'h3'
import { requireUser } from '../../utils/guards'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const { sqlite } = getDb()
  const now = new Date().toISOString()

  const row = sqlite
    .prepare(
      `
      SELECT
        e.starts_at     AS startsAt,
        e.ends_at       AS endsAt,
        p.id            AS planId,
        p.plan_code     AS planCode,
        p.name          AS planName,
        p.duration_days AS planDurationDays,
        p.price_cents   AS planPriceCents
      FROM entitlements e
      JOIN plans p ON p.plan_code = e.entitlement_type
      WHERE e.user_id           = ?
        AND e.entitlement_type  = 'premium_bundle'
        AND e.starts_at        <= ?
        AND e.ends_at          > ?
      LIMIT 1
    `,
    )
    .get(user.id, now, now) as
    | {
        startsAt: string
        endsAt: string
        planId: number
        planCode: string
        planName: string
        planDurationDays: number
        planPriceCents: number
      }
    | undefined

  if (!row) {
    return {
      hasActiveSubscription: false,
      plan: null,
      entitlement: null,
    }
  }

  return {
    hasActiveSubscription: true,
    plan: {
      id: row.planId,
      code: row.planCode,
      name: row.planName,
      durationDays: row.planDurationDays,
      priceCents: row.planPriceCents,
    },
    entitlement: {
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    },
  }
})
