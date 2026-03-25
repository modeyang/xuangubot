import { setup } from '@nuxt/test-utils/e2e'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareTestDb } from './test-db'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

let integrationSetupPromise: Promise<void> | undefined

export function setupNuxtIntegration() {
  if (!integrationSetupPromise) {
    integrationSetupPromise = (async () => {
      await prepareTestDb()
      const port = await findOpenPort()
      await setup({
        rootDir: projectRoot,
        server: true,
        browser: false,
        port,
      })
    })()
  }

  return integrationSetupPromise
}

async function findOpenPort() {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        server.close(() => reject(new Error('failed to bind an ephemeral port')))
        return
      }
      const port = addr.port
      server.close(() => resolve(port))
    })
  })
}
