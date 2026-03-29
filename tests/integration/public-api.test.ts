import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'
import { encodeSessionCookieValue } from '../../server/utils/session'

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
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('vary')).toContain('Cookie')
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
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('vary')).toContain('Cookie')
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

  it('returns teaser-only premium lists without entitlement', async () => {
    const res = await $fetch('/api/articles/premium?type=zzd&limit=20')
    expect((res as any).access.entitled).toBe(false)
    expect(Array.isArray((res as any).articles)).toBe(true)
    expect((res as any).articles[0].visibility).toBe('premium')
    expect((res as any).articles[0].excerpt).toBeNull()
    expect('bodyHtml' in (res as any).articles[0]).toBe(false)
  })

  it('returns full teaser data for entitled premium lists', async () => {
    const res = await $fetch('/api/articles/premium?type=zzd&limit=20', {
      headers: {
        cookie: `xgt_session_token=${encodeSessionCookieValue('fixture-premium-token')}`,
      },
    })
    expect((res as any).access.entitled).toBe(true)
    expect((res as any).access.planCode).toBe('premium_bundle')
    expect((res as any).articles[0].excerpt).toBe('premium excerpt')
    expect('bodyHtml' in (res as any).articles[0]).toBe(false)
    expect('bodyMarkdown' in (res as any).articles[0]).toBe(false)
  })

  it('does not trust raw user-id cookies or invalid session tokens', async () => {
    const rawUserId = await $fetch('/api/articles/premium?type=zzd&limit=20', {
      headers: {
        cookie: 'xgt_user_id=9001',
      },
    })
    expect((rawUserId as any).access.entitled).toBe(false)
    expect((rawUserId as any).articles[0].excerpt).toBeNull()

    const badSession = await $fetch('/api/articles/premium?type=zzd&limit=20', {
      headers: {
        cookie: `xgt_session_token=${encodeSessionCookieValue('not-a-real-session')}`,
      },
    })
    expect((badSession as any).access.entitled).toBe(false)
    expect((badSession as any).articles[0].excerpt).toBeNull()
  })

  it('applies private no-store cache policy to premium teaser endpoint', async () => {
    const res = await fetchRaw('/api/articles/premium?type=zzd')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('uses default limit=20 and orders premium lists by published_at desc', async () => {
    const tsRes = (await $fetch('/api/articles/premium?type=ts')) as any
    expect(tsRes.limit).toBe(20)
    expect(tsRes.articles.map((a: any) => a.id).slice(0, 2)).toEqual([2260002, 2260003])

    const zzdRes = (await $fetch('/api/articles/premium?type=zzd')) as any
    expect(zzdRes.limit).toBe(20)
    expect(zzdRes.articles.map((a: any) => a.id).slice(0, 2)).toEqual([2260001, 2260004])
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
