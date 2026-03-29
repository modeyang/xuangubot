import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { requireUser } from '../../../utils/guards'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const parsed = z.object({ orderId: z.string() }).safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const orderId = parsed.data.orderId

  const { sqlite } = getDb()
  const order = sqlite
    .prepare(
      `
      SELECT id, user_id AS userId, status, amount_cents AS amountCents
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(orderId) as
    | { id: number; userId: number; status: string; amountCents: number }
    | undefined

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'order not found' })
  }

  if (order.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'forbidden' })
  }

  if (order.status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'order is not pending' })
  }

  const paymentToken = randomUUID()

  return {
    paymentToken,
    orderId: order.id,
    amountCents: order.amountCents,
    status: 'pending',
  }
})
