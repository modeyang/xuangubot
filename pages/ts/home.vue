<template>
  <LegacyShell>
    <div data-testid="legacy-ts-home" class="legacy-stack">
      <section class="legacy-card legacy-hero">
        <h1 class="legacy-h1">TS</h1>
        <p class="legacy-muted">Public teaser list (latest by published_at desc).</p>
      </section>

      <section class="legacy-card" aria-label="TS articles">
        <div class="legacy-split legacy-split--baseline">
          <h2 class="legacy-h2">Latest</h2>
          <p class="legacy-muted">Limit {{ limit }}</p>
        </div>

        <ul v-if="articles.length" class="legacy-list">
          <li v-for="a in articles" :key="a.id">
            <NuxtLink :to="`/article/${a.id}.html`">{{ a.title }}</NuxtLink>
            <div class="legacy-muted" v-if="a.publishedAt || a.sourceName">
              <span v-if="a.sourceName">Source: {{ a.sourceName }}</span>
              <span v-if="a.publishedAt"> · {{ a.publishedAt }}</span>
            </div>
            <div class="legacy-teaser" v-if="a.access.allowed && a.excerpt">{{ a.excerpt }}</div>
            <div class="legacy-muted" v-else-if="!a.access.allowed">
              Premium teaser only. Full preview unlocks with premium_bundle.
            </div>
          </li>
        </ul>
        <p v-else class="legacy-muted">No TS articles yet.</p>
        <p class="legacy-muted" v-if="pageAccess.entitled">premium_bundle active</p>
      </section>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import { setHeader } from 'h3'
import LegacyShell from '~/components/layout/LegacyShell.vue'

const route = useRoute()
const requestHeaders = useRequestHeaders(['cookie'])
const sessionToken = useCookie<string | null>('xgt_session_token')
if (import.meta.server) {
  const event = useRequestEvent()
  if (event) {
    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'Vary', 'Cookie')
  }
}
const limit = computed(() => {
  const raw = route.query.limit
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 20
})

function hashToken(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

const authKey = computed(() => (sessionToken.value ? hashToken(sessionToken.value) : 'anon'))

type PremiumTeaser = {
  id: number
  title: string
  excerpt: string | null
  articleType: string
  publishedAt: string | null
  sourceName: string | null
  visibility: string
  access: { allowed: boolean }
}

const { data } = useFetch<{ access: { planCode: string | null; entitled: boolean }; articles: PremiumTeaser[] }>(
  () => `/api/articles/premium?type=ts&limit=${limit.value}`,
  {
    headers: requestHeaders,
    key: computed(() => `premium:ts:${limit.value}:${authKey.value}`),
    watch: [sessionToken, limit],
  },
)
const articles = computed(() => data.value?.articles ?? [])
const pageAccess = computed(() => data.value?.access ?? { planCode: null, entitled: false })
</script>
