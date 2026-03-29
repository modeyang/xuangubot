import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { getDb } from '../../../utils/db'
import { requireUser } from '../../../utils/guards'

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(baseIso: string, days: number) {
  const ms = Date.parse(baseIso)
  return new Date(ms + days * 86_400_000).toISOString()
}

const BodySchema = z.object({
  paymentToken: z.string().optional(),
  orderId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  if (!parsed.data.orderId) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' })
  }

  const orderId = Number(parsed.data.orderId)
  if (isNaN(orderId)) {
    throw createError({ statusCode: 400, statusMessage: 'orderId must be a number' })
  }

  const { sqlite } = getDb()

  const result = sqlite.transaction(() => {
    const order = sqlite
      .prepare(
        `
        SELECT
          o.id,
          o.user_id AS userId,
          o.plan_id AS planId,
          o.status,
          o.paid_at AS paidAt,
          p.plan_code AS planCode,
          p.duration_days AS durationDays
        FROM orders o
        JOIN plans p ON p.id = o.plan_id
        WHERE o.id = ?
        LIMIT 1
      `,
      )
      .get(orderId) as
      | {
          id: number
          userId: number
          planId: number
          status: string
          paidAt: string | null
          planCode: string
          durationDays: number
        }
      | undefined

    if (!order) {
      throw createError({ statusCode: 404, statusMessage: 'order not found' })
    }

    if (order.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'forbidden' })
    }

    const paidAt = order.paidAt ?? nowIso()

    if (order.status !== 'paid') {
      sqlite
        .prepare(
          `
          UPDATE orders
          SET status = 'paid', paid_at = ?, provider_order_id = COALESCE(provider_order_id, ?)
          WHERE id = ?
        `,
        )
        .run(paidAt, `mock_${order.id}`, order.id)
    }

    const activeEntitlement = sqlite
      .prepare(
        `
        SELECT id, ends_at AS endsAt
        FROM entitlements
        WHERE user_id = ? AND entitlement_type = ? AND ends_at > ?
        LIMIT 1
      `,
      )
      .get(user.id, 'premium_bundle', nowIso()) as
      | { id: number; endsAt: string }
      | undefined

    let startsAt: string
    let endsAt: string

    if (activeEntitlement) {
      startsAt = nowIso()
      endsAt = addDaysIso(activeEntitlement.endsAt, order.durationDays)
      sqlite
        .prepare(
          `
          UPDATE entitlements
          SET ends_at = ?
          WHERE id = ?
        `,
        )
        .run(endsAt, activeEntitlement.id)
    } else {
      startsAt = paidAt
      endsAt = addDaysIso(startsAt, order.durationDays)
      sqlite
        .prepare(
          `
          INSERT INTO entitlements(user_id, entitlement_type, starts_at, ends_at, source_order_id)
          VALUES (?, ?, ?, ?, ?)
        `,
        )
        .run(user.id, 'premium_bundle', startsAt, endsAt, order.id)
    }

    return { orderId: order.id, status: 'paid' as const, entitlement: { type: 'premium_bundle', startsAt, endsAt } }
  })()

  return result
})
