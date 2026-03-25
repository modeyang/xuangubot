import { defineConfig } from 'drizzle-kit'
import { getDbPath } from './db/config'

export default defineConfig({
  dialect: 'sqlite',
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dbCredentials: {
    // Drizzle Kit expects a string `url` for sqlite; a plain file path is valid here.
    url: getDbPath(),
  },
  strict: true,
  verbose: false,
})
