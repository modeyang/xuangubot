export const DEFAULT_DB_PATH = './storage/db/xuangutong.sqlite'

export function getDbPath() {
  return process.env.DB_PATH ?? DEFAULT_DB_PATH
}

