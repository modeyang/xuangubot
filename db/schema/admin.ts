import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Spec 9.1: Ingestion and Audit
export const ingestRuns = sqliteTable('ingest_runs', {
  id: integer('id').primaryKey(),
  jobName: text('job_name').notNull(),
  sourceName: text('source_name'),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  status: text('status').notNull(),
  summaryJson: text('summary_json'),
})

export const rawSourceRecords = sqliteTable('raw_source_records', {
  id: integer('id').primaryKey(),
  sourceName: text('source_name').notNull(),
  sourceRef: text('source_ref').notNull(),
  fetchedAt: text('fetched_at').notNull(),
  payloadPath: text('payload_path'),
  payloadHash: text('payload_hash'),
  normalizeStatus: text('normalize_status'),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey(),
  actorType: text('actor_type').notNull(),
  actorId: text('actor_id'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  payloadJson: text('payload_json'),
  createdAt: text('created_at').notNull(),
})

