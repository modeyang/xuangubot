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
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      articleType: articles.articleType,
      visibility: articles.visibility,
      status: articles.status,
      coverUrl: articles.coverUrl,
      publishedAt: articles.publishedAt,
      sourceName: articles.sourceName,
    })
    .from(articles)
    .where(
      and(
        eq(articles.articleType, type),
        eq(articles.status, 'published'),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .all()
}
