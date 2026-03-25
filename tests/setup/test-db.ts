import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

let preparePromise: Promise<void> | undefined

let tempDir: string | undefined
let cleanupRegistered = false

function cleanupTempDir() {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true })
    tempDir = undefined
  }
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`command failed: ${cmd} ${args.join(' ')} (exit=${code})`))
    })
  })
}

export async function prepareTestDb() {
  // Task 1 bootstrap-only version:
  // 1. create a run-local temp dir under tmpdir()
  // 2. set process.env.DB_PATH to <tempdir>/test.sqlite
  // 3. register process-level teardown that removes the temp dir after the test run

  if (preparePromise) return preparePromise

  preparePromise = (async () => {
    if (!tempDir) {
      tempDir = mkdtempSync(join(tmpdir(), 'xgt-test-'))
      process.env.DB_PATH = join(tempDir, 'test.sqlite')
    }

    if (!cleanupRegistered) {
      cleanupRegistered = true
      process.once('exit', cleanupTempDir)
      process.once('beforeExit', cleanupTempDir)
    }

    // Task 4: prepare schema and seed required fixtures before Nuxt boots.
    await run('npm', ['run', 'db:prepare'])
    await run('npm', ['run', 'seed:plans'])
    await run('npm', ['run', 'seed:fixtures'])
  })()

  return preparePromise
}
