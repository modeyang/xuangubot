import { getDb } from '../utils/db'

function nowIso() {
  return new Date().toISOString()
}

export async function bootstrapFirstAdmin(phone: string) {
  const { sqlite } = getDb()
  const tx = sqlite.transaction(() => {
    const existingAdmin = sqlite
      .prepare(`SELECT id, phone FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`)
      .get() as { id: number; phone: string } | undefined

    if (existingAdmin) {
      if (existingAdmin.phone !== phone) {
        throw new Error(`admin already bootstrapped for different phone: ${existingAdmin.phone}`)
      }

      return { id: existingAdmin.id, created: false as const }
    }

    const existingUser = sqlite
      .prepare(`SELECT id, phone, role FROM users WHERE phone = ? LIMIT 1`)
      .get(phone) as { id: number; phone: string; role: string } | undefined

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existingUser.id)
      }

      return { id: existingUser.id, created: false as const }
    }

    const createdAt = nowIso()
    const result = sqlite
      .prepare(
        `
        INSERT INTO users(phone, display_name, role, created_at)
        VALUES (?, NULL, 'admin', ?)
      `,
      )
      .run(phone, createdAt)

    return { id: Number(result.lastInsertRowid), created: true as const }
  })

  return tx()
}

export async function ensureBetaAllowlist(phone: string, createdByUserId: number) {
  const { sqlite } = getDb()

  const row = sqlite
    .prepare(`SELECT phone FROM beta_access_phones WHERE phone = ? LIMIT 1`)
    .get(phone) as { phone: string } | undefined

  if (row) {
    sqlite
      .prepare(`UPDATE beta_access_phones SET enabled = 1 WHERE phone = ?`)
      .run(phone)
    return { ok: true as const, inserted: false as const }
  }

  sqlite
    .prepare(
      `
      INSERT INTO beta_access_phones(phone, enabled, created_at, created_by)
      VALUES (?, 1, ?, ?)
    `,
    )
    .run(phone, nowIso(), createdByUserId)

  return { ok: true as const, inserted: true as const }
}
