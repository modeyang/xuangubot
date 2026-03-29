import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { basename, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'
import { encodeSessionCookieValue } from '../../server/utils/session'

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
  async function fetchRaw(path: string, init?: RequestInit) {
    return testFetch(url(path), init)
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

  it('renders TS and ZZD teaser pages and responds to premium cookie state', async () => {
    const tsPublic = await fetchRaw('/ts/home')
    expect(tsPublic.status).toBe(200)
    expect(tsPublic.headers.get('cache-control')).toBe('private, no-store')
    expect(tsPublic.headers.get('vary')).toContain('Cookie')
    const tsPublicHtml = await tsPublic.text()
    expect(tsPublicHtml).toContain('data-testid="legacy-ts-home"')
    expect(tsPublicHtml).toContain('Premium teaser only')

    const tsForged = await fetchRaw('/ts/home', {
      headers: {
        cookie: 'xgt_user_id=9001',
      },
    } as RequestInit)
    expect(tsForged.status).toBe(200)
    const tsForgedHtml = await tsForged.text()
    expect(tsForgedHtml).toContain('Premium teaser only')

    const tsPremium = await fetchRaw('/ts/home', {
      headers: {
        cookie: `xgt_session_token=${encodeSessionCookieValue('fixture-premium-token')}`,
      },
    } as RequestInit)
    expect(tsPremium.status).toBe(200)
    const tsPremiumHtml = await tsPremium.text()
    expect(tsPremiumHtml).toContain('premium_bundle active')
    expect(tsPremiumHtml).toContain('ts premium excerpt')
    expect(tsPremiumHtml).not.toContain('fixture-premium-token')

    const zzdPublic = await fetchRaw('/zzd/home')
    expect(zzdPublic.status).toBe(200)
    expect(zzdPublic.headers.get('cache-control')).toBe('private, no-store')
    expect(zzdPublic.headers.get('vary')).toContain('Cookie')
    const zzdPublicHtml = await zzdPublic.text()
    expect(zzdPublicHtml).toContain('data-testid="legacy-zzd-home"')
    expect(zzdPublicHtml).toContain('Premium teaser only')

    const zzdPremium = await fetchRaw('/zzd/home', {
      headers: {
        cookie: `xgt_session_token=${encodeSessionCookieValue('fixture-premium-token')}`,
      },
    } as RequestInit)
    expect(zzdPremium.status).toBe(200)
    const zzdPremiumHtml = await zzdPremium.text()
    expect(zzdPremiumHtml).toContain('premium_bundle active')
    expect(zzdPremiumHtml).toContain('premium excerpt')
    expect(zzdPremiumHtml).not.toContain('fixture-premium-token')
  })
})
