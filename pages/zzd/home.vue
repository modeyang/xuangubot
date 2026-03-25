<template>
  <LegacyShell>
    <div data-testid="legacy-zzd-home" class="legacy-stack">
      <section class="legacy-card legacy-hero">
        <h1 class="legacy-h1">ZZD</h1>
        <p class="legacy-muted">Public teaser list (latest by published_at desc).</p>
      </section>

      <section class="legacy-card" aria-label="ZZD articles">
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
            <div class="legacy-teaser" v-if="a.excerpt">{{ a.excerpt }}</div>
          </li>
        </ul>
        <p v-else class="legacy-muted">No ZZD articles yet.</p>
      </section>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import LegacyShell from '~/components/layout/LegacyShell.vue'

const route = useRoute()
const limit = computed(() => {
  const raw = route.query.limit
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 20
})

type PremiumTeaser = {
  id: number
  title: string
  excerpt: string | null
  articleType: string
  publishedAt: string | null
  sourceName: string | null
  visibility: string
}

const { data } = useFetch<{ articles: PremiumTeaser[] }>(() => `/api/articles/premium?type=zzd&limit=${limit.value}`)
const articles = computed(() => data.value?.articles ?? [])
</script>
