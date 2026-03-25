import { getDb } from '../utils/db'

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(baseIso: string, days: number) {
  const ms = Date.parse(baseIso)
  return new Date(ms + days * 86_400_000).toISOString()
}

export async function createOrder(userId: number, planCode: string) {
  const { sqlite } = getDb()

  const plan = sqlite
    .prepare(
      `
      SELECT id, plan_code AS planCode, duration_days AS durationDays, price_cents AS priceCents, enabled
      FROM plans
      WHERE plan_code = ? AND enabled = 1
      LIMIT 1
    `,
    )
    .get(planCode) as
    | {
        id: number
        planCode: string
        durationDays: number
        priceCents: number
        enabled: 0 | 1
      }
    | undefined

  if (!plan) {
    throw new Error(`plan not found or disabled: ${planCode}`)
  }

  const createdAt = nowIso()
  const result = sqlite
    .prepare(
      `
      INSERT INTO orders(
        user_id, plan_id, provider, amount_cents, status, provider_order_id, created_at, paid_at
      )
      VALUES (?, ?, 'mock', ?, 'pending', NULL, ?, NULL)
    `,
    )
    .run(userId, plan.id, plan.priceCents, createdAt)

  return { id: Number(result.lastInsertRowid) }
}

export async function completeMockPayment(orderId: number, actorId: number) {
  const { sqlite } = getDb()

  const tx = sqlite.transaction(() => {
    const order = sqlite
      .prepare(
        `
        SELECT
          o.id,
          o.user_id AS userId,
          o.plan_id AS planId,
          o.status,
          o.paid_at AS paidAt,
          o.provider_order_id AS providerOrderId,
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
          providerOrderId: string | null
          planCode: string
          durationDays: number
        }
      | undefined

    if (!order) {
      throw new Error(`order not found: ${orderId}`)
    }

    const paidAt = order.paidAt ?? nowIso()
    const providerOrderId = order.providerOrderId ?? `mock_${order.id}`

    if (order.status !== 'paid') {
      sqlite
        .prepare(
          `
          UPDATE orders
          SET status = 'paid', paid_at = ?, provider_order_id = ?
          WHERE id = ?
        `,
        )
        .run(paidAt, providerOrderId, order.id)
    }

    const entitlementExists = sqlite
      .prepare(`SELECT 1 AS ok FROM entitlements WHERE source_order_id = ? LIMIT 1`)
      .get(order.id) as { ok: 1 } | undefined

    if (!entitlementExists) {
      const startsAt = paidAt
      const endsAt = addDaysIso(startsAt, order.durationDays)
      sqlite
        .prepare(
          `
          INSERT INTO entitlements(user_id, entitlement_type, starts_at, ends_at, source_order_id)
          VALUES (?, ?, ?, ?, ?)
        `,
        )
        .run(order.userId, order.planCode, startsAt, endsAt, order.id)
    }

    const auditExists = sqlite
      .prepare(
        `
        SELECT 1 AS ok
        FROM audit_logs
        WHERE action = 'billing.complete_mock_payment'
          AND target_type = 'order'
          AND target_id = ?
        LIMIT 1
      `,
      )
      .get(String(order.id)) as { ok: 1 } | undefined

    // Record order completion only once, even if callers retry the same completion path.
    if (!auditExists) {
      sqlite
        .prepare(
          `
          INSERT INTO audit_logs(actor_type, actor_id, action, target_type, target_id, payload_json, created_at)
          VALUES ('user', ?, 'billing.complete_mock_payment', 'order', ?, NULL, ?)
        `,
        )
        .run(String(actorId), String(order.id), nowIso())
    }

    return { ok: true as const, orderId: order.id }
  })

  return tx()
}
