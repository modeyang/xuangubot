import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { basename, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'

await setupNuxtIntegration()

describe('app shell', () => {
  it('sets DB_PATH before booting the Nuxt application shell', async () => {
    expect(process.env.DB_PATH).toBeTruthy()
    expect(process.env.DB_PATH).toMatch(/test\.sqlite$/)
    expect(basename(dirname(process.env.DB_PATH!))).toMatch(/^xgt-test-/)

    const html = await $fetch('/', { responseType: 'text' })

    expect(html).toContain('data-testid="legacy-home"')
    expect(html).toContain('Xuangutong MVP')
  })
})

describe('legacy pages', () => {
  async function fetchRaw(path: string) {
    return testFetch(url(path))
  }

  it('preserves the legacy .html route shapes', async () => {
    const stock = await fetchRaw('/stock/000001.html')
    expect(stock.status).toBe(200)
    expect(await stock.text()).toContain('data-testid="legacy-stock-page"')

    const theme = await fetchRaw('/theme/18129294.html')
    expect(theme.status).toBe(200)
    expect(await theme.text()).toContain('data-testid="legacy-theme-page"')

    const article = await fetchRaw('/article/1261948.html')
    expect(article.status).toBe(200)
    expect(await article.text()).toContain('data-testid="legacy-article-page"')
  })
})
