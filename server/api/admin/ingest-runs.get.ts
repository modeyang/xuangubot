import { defineEventHandler, setHeader } from 'h3'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/guards'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Cookie')

  await requireAdmin(event)

  const { sqlite } = getDb()

  const runs = sqlite
    .prepare(
      `
      SELECT
        id,
        job_name AS jobName,
        source_name AS sourceName,
        started_at AS startedAt,
        finished_at AS finishedAt,
        status,
        summary_json AS summaryJson
      FROM ingest_runs
      ORDER BY started_at DESC, id DESC
      LIMIT 200
    `,
    )
    .all() as Array<{
    id: number
    jobName: string
    sourceName: string | null
    startedAt: string
    finishedAt: string | null
    status: string
    summaryJson: string | null
  }>

  return { runs }
})

