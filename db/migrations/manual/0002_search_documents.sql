-- Manual migration: FTS5 search virtual table + manual migration tracking.
--
-- Update strategy notes (Spec/Plan requirements):
-- - Article publish/unpublish writes through to FTS rows
-- - Stock/theme ingestion rebuilds or upserts FTS rows
-- - Nightly repair job rebuilds FTS from canonical tables
-- - Manual SQL migrations must use an ordered numeric prefix after the generated base migration
-- - scripts/apply-manual-migrations.ts applies files in lexical order and records in manual_migrations

CREATE TABLE IF NOT EXISTS manual_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE search_documents USING fts5(
  doc_type,
  doc_id,
  title,
  body,
  keywords,
  tokenize = 'unicode61'
);

