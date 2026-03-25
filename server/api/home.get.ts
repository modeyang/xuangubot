import { defineEventHandler, setHeader } from 'h3'
import { loadHomeModules } from '../repositories/homepage'

function safeJsonParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  // Freshness target: 5 minutes.
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=300')

  const modules = (await loadHomeModules()).map((m) => ({
    id: m.id,
    moduleKey: m.moduleKey,
    title: m.title,
    sortOrder: m.sortOrder,
    config: safeJsonParse(m.configJson),
  }))

  return { modules }
})

