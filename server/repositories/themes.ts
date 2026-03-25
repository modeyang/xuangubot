import { eq } from 'drizzle-orm'
import { themes } from '../../db/schema'
import { getDb } from '../utils/db'

export async function loadThemeById(id: number) {
  const { orm } = getDb()
  return orm.select().from(themes).where(eq(themes.id, id)).limit(1).get() ?? null
}

