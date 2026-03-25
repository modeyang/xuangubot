import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import Database from 'better-sqlite3'
import { openSqlite } from '../server/utils/db'

function ensureManualMigrationsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS manual_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `)
}

function listManualMigrationFiles(dir: string) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
}

function isApplied(db: Database.Database, name: string) {
  const row = db
    .prepare(`SELECT 1 AS ok FROM manual_migrations WHERE name = ? LIMIT 1`)
    .get(name) as { ok: 1 } | undefined
  return Boolean(row?.ok)
}

function markApplied(db: Database.Database, name: string) {
  db.prepare(`INSERT INTO manual_migrations(name, applied_at) VALUES (?, ?)`).run(
    name,
    new Date().toISOString(),
  )
}

function applySqlFile(db: Database.Database, filePath: string, name: string) {
  const sql = readFileSync(filePath, 'utf8')
  const tx = db.transaction(() => {
    db.exec(sql)
    markApplied(db, name)
  })
  tx()
}

const manualDir = join(process.cwd(), 'db', 'migrations', 'manual')
const db = openSqlite()

ensureManualMigrationsTable(db)

const files = listManualMigrationFiles(manualDir)
if (files.length === 0) {
  console.log('[apply-manual-migrations] no manual migrations found')
  db.close()
  process.exit(0)
}

let applied = 0
for (const file of files) {
  if (isApplied(db, file)) continue
  applySqlFile(db, join(manualDir, file), file)
  applied += 1
  console.log(`[apply-manual-migrations] applied ${file}`)
}

console.log(`[apply-manual-migrations] done (applied ${applied})`)
db.close()
