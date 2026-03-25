import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../db/schema'
import { getDbPath } from '../../db/config'

type DbHandle = {
  path: string
  sqlite: Database.Database
  orm: ReturnType<typeof drizzle>
}

let cachedDb: DbHandle | undefined

function applyPragmas(db: Database.Database) {
  // Required pragmas (Task 2).
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
}

export function openSqlite(dbPath = getDbPath()) {
  const db = new Database(dbPath)

  applyPragmas(db)

  return db
}

export function closeDb() {
  if (!cachedDb) return

  cachedDb.sqlite.close()
  cachedDb = undefined
}

export function getDb() {
  const path = getDbPath()
  if (cachedDb && cachedDb.path === path) {
    return cachedDb
  }

  closeDb()

  const sqlite = openSqlite(path)
  const orm = drizzle(sqlite, { schema })

  cachedDb = { path, sqlite, orm }
  return cachedDb
}
