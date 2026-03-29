import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'
import { requireUser } from '../utils/guards'
import { createOrder } from '../repositories/billing'

const BodySchema = z.object({
  planCode: z.enum(['premium_bundle']),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  const { planCode } = parsed.data
  const order = await createOrder(user.id, planCode)

  return {
    orderId: order.id,
    planCode,
    amountCents: 0, // caller should use GET /api/orders/[id] for authoritative amount
    status: 'pending',
  }
})
