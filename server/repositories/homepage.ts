import { asc, eq } from 'drizzle-orm'
import { homepageModules } from '../../db/schema'
import { getDb } from '../utils/db'

export async function loadHomeModules() {
  const { orm } = getDb()
  return orm
    .select()
    .from(homepageModules)
    .where(eq(homepageModules.enabled, true))
    .orderBy(asc(homepageModules.sortOrder), asc(homepageModules.id))
    .all()
}

