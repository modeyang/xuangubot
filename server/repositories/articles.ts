import { and, desc, eq } from 'drizzle-orm'
import { articles } from '../../db/schema'
import { getDb } from '../utils/db'

export async function loadArticleById(id: number) {
  const { orm } = getDb()
  return orm.select().from(articles).where(eq(articles.id, id)).limit(1).get() ?? null
}

export async function listPremiumArticles(type: string, limit = 10) {
  const { orm } = getDb()
  return orm
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.articleType, type),
        eq(articles.visibility, 'premium'),
        eq(articles.status, 'published'),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .all()
}

