import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'

import { getDb } from '../server/utils/db'
import { bootstrapFirstAdmin, ensureBetaAllowlist } from '../server/repositories/admin'

async function main() {
  const phone = process.env.ADMIN_BOOTSTRAP_PHONE
  if (!phone) {
    console.error('[bootstrap-admin] missing ADMIN_BOOTSTRAP_PHONE')
    process.exit(1)
  }

  // Ensure DB is migrated before we touch it (bootstrapping is frequently run on fresh DBs).
  migrate(getDb().orm, { migrationsFolder: join(process.cwd(), 'db', 'migrations') })

  const admin = await bootstrapFirstAdmin(phone)
  await ensureBetaAllowlist(phone, admin.id)

  console.log(`[bootstrap-admin] admin ready: userId=${admin.id} phone=${phone}`)
}

main().catch((err) => {
  console.error('[bootstrap-admin] failed', err)
  process.exit(1)
})
