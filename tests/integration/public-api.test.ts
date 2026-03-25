import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'

await setupNuxtIntegration()

describe('public api', () => {
  async function fetchStatus(path: string) {
    try {
      await $fetch(path)
      return 200
    } catch (err: any) {
      return (
        err?.statusCode ??
        err?.response?.status ??
        err?.status ??
        err?.cause?.statusCode ??
        0
      )
    }
  }

  async function fetchRaw(path: string) {
    return testFetch(url(path))
  }

  it('returns home modules', async () => {
    const res = await $fetch('/api/home')
    expect(res).toHaveProperty('modules')
    expect(Array.isArray((res as any).modules)).toBe(true)
  })

  it('sets the expected cache policy for home modules', async () => {
    const res = await fetchRaw('/api/home')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  it('returns enabled plan', async () => {
    const res = await $fetch('/api/plans')
    expect((res as any).plan).toBeTruthy()
    expect((res as any).plan.planCode).toBe('premium_bundle')
  })

  it('sets the expected cache policy for plans', async () => {
    const res = await fetchRaw('/api/plans')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    )
  })

  it('returns stock snapshot (symbol preserves leading zeroes)', async () => {
    const res = await $fetch('/api/stocks/000001')
    expect((res as any).stock.symbol).toBe('000001')
    expect((res as any)).toHaveProperty('quote')
    expect(Array.isArray((res as any).themes)).toBe(true)
    expect(Array.isArray((res as any).articles)).toBe(true)
    expect(Array.isArray((res as any).announcements)).toBe(true)
  })

  it('sets the expected cache policy for stock snapshot', async () => {
    const res = await fetchRaw('/api/stocks/000001')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
    )
  })

  it('returns stock quote snapshots', async () => {
    const res = await $fetch('/api/stocks/000001/quotes')
    expect((res as any).symbol).toBe('000001')
    expect(Array.isArray((res as any).quotes)).toBe(true)
  })

  it('sets the expected cache policy for stock quotes', async () => {
    const res = await fetchRaw('/api/stocks/000001/quotes')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
    )
  })

  it('validates limit for stock quote snapshots', async () => {
    expect(await fetchStatus('/api/stocks/000001/quotes?limit=0')).toBe(400)
    expect(await fetchStatus('/api/stocks/000001/quotes?limit=2001')).toBe(400)
    expect(await fetchStatus('/api/stocks/000001/quotes?limit=abc')).toBe(400)
  })

  it('returns stock daily bars', async () => {
    const res = await $fetch('/api/stocks/000001/daily-bars')
    expect((res as any).symbol).toBe('000001')
    expect(Array.isArray((res as any).dailyBars)).toBe(true)
  })

  it('sets the expected cache policy for stock daily bars', async () => {
    const res = await fetchRaw('/api/stocks/000001/daily-bars')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  it('validates limit for stock daily bars', async () => {
    expect(await fetchStatus('/api/stocks/000001/daily-bars?limit=0')).toBe(400)
    expect(await fetchStatus('/api/stocks/000001/daily-bars?limit=3651')).toBe(400)
    expect(await fetchStatus('/api/stocks/000001/daily-bars?limit=abc')).toBe(400)
  })

  it('returns theme details', async () => {
    const res = await $fetch('/api/themes/18129294')
    expect((res as any).theme).toBeTruthy()
    expect((res as any).theme.id).toBe(18129294)
    expect(Array.isArray((res as any).stocks)).toBe(true)
    expect((res as any)).toHaveProperty('snapshot')
    expect(Array.isArray((res as any).articles)).toBe(true)
  })

  it('sets the expected cache policy for themes', async () => {
    const res = await fetchRaw('/api/themes/18129294')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=120, stale-while-revalidate=120',
    )
  })

  it('returns public article with access allowed', async () => {
    const res = await $fetch('/api/articles/1261948')
    expect((res as any).article.id).toBe(1261948)
    expect((res as any).access.allowed).toBe(true)
    expect(Array.isArray((res as any).relatedStocks)).toBe(true)
    expect(Array.isArray((res as any).relatedThemes)).toBe(true)
  })

  it('sets the expected cache policy for a public article', async () => {
    const res = await fetchRaw('/api/articles/1261948')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600',
    )
  })

  it('redacts premium article body for public api', async () => {
    const res = await $fetch('/api/articles/2260001')
    expect((res as any).article.id).toBe(2260001)
    expect((res as any).access.allowed).toBe(false)
    expect((res as any).article.bodyMarkdown).toBeNull()
    expect((res as any).article.bodyHtml).toBeNull()
  })

  it('sets the expected cache policy for a premium article teaser', async () => {
    const res = await fetchRaw('/api/articles/2260001')
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
    )
  })

  it('returns grouped search results', async () => {
    const res = await $fetch('/api/search?q=AI')
    expect(Array.isArray((res as any).stocks)).toBe(true)
    expect(Array.isArray((res as any).themes)).toBe(true)
    expect(Array.isArray((res as any).articles)).toBe(true)
  })

  it('marks search responses as non-cacheable', async () => {
    const res = await fetchRaw('/api/search?q=AI')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('validates search query length', async () => {
    expect(await fetchStatus('/api/search?q=a')).toBe(400)
  })

  it('validates numeric IDs in routes', async () => {
    expect(await fetchStatus('/api/themes/abc')).toBe(400)
    expect(await fetchStatus('/api/articles/nope')).toBe(400)
    expect(await fetchStatus('/api/themes/9007199254740993')).toBe(400)
    expect(await fetchStatus('/api/articles/9007199254740993')).toBe(400)
  })
})
