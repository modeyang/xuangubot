import { defineEventHandler, setHeader } from 'h3'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/guards'

export default defineEventHandler(async (event) => {
  // Admin data is sensitive and user-specific.
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  await requireAdmin(event)

  const { sqlite } = getDb()

  const orders = sqlite
    .prepare(
      `
      SELECT
        o.id,
        o.status,
        o.provider,
        o.amount_cents AS amountCents,
        o.provider_order_id AS providerOrderId,
        o.created_at AS createdAt,
        o.paid_at AS paidAt,
        u.id AS userId,
        u.phone AS userPhone,
        p.plan_code AS planCode
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN plans p ON p.id = o.plan_id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 200
    `,
    )
    .all() as Array<{
    id: number
    status: string
    provider: string
    amountCents: number
    providerOrderId: string | null
    createdAt: string
    paidAt: string | null
    userId: number
    userPhone: string
    planCode: string
  }>

  return { orders }
})

