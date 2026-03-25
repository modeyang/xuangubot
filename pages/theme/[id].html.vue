<template>
  <LegacyShell>
    <div data-testid="legacy-theme-page" class="legacy-stack">
      <div v-if="pending" class="legacy-card">Loading…</div>
      <div v-else-if="error" class="legacy-card">
        <h1 class="legacy-h1">Theme</h1>
        <p class="legacy-muted">Failed to load theme: {{ error.message }}</p>
      </div>

      <template v-else>
        <ThemeSummaryCard :theme="themeData.theme" :snapshot="themeData.snapshot" />

        <section class="legacy-card" aria-label="Theme stocks">
          <h2 class="legacy-h2">Stocks</h2>
          <ul v-if="themeData.stocks.length" class="legacy-list legacy-list--cols">
            <li v-for="s in themeData.stocks" :key="String(s.symbol)">
              <NuxtLink :to="`/stock/${s.symbol}.html`">
                {{ s.symbol }}
                <span class="legacy-muted" v-if="s.name">· {{ s.name }}</span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="legacy-muted">No stocks.</p>
        </section>

        <section class="legacy-card" aria-label="Theme articles">
          <h2 class="legacy-h2">Articles</h2>
          <ul v-if="themeData.articles.length" class="legacy-list">
            <li v-for="a in themeData.articles" :key="a.id">
              <NuxtLink :to="`/article/${a.id}.html`">{{ a.title }}</NuxtLink>
              <span v-if="a.publishedAt" class="legacy-muted"> · {{ a.publishedAt }}</span>
            </li>
          </ul>
          <p v-else class="legacy-muted">No articles.</p>
        </section>
      </template>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import LegacyShell from '~/components/layout/LegacyShell.vue'
import ThemeSummaryCard from '~/components/themes/ThemeSummaryCard.vue'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

type ThemeApiResponse = {
  theme: { id: number; slug: string; name: string; summary: string | null }
  stocks: Array<{ symbol: string; name: string | null }>
  snapshot: { capturedAt: string; heatScore: number | null; rank: number | null; payload: unknown } | null
  articles: Array<{ id: number; title: string; publishedAt: string | null }>
}

const { data, pending, error } = useFetch<ThemeApiResponse>(() => `/api/themes/${encodeURIComponent(id.value)}`)
const themeData = computed(() => data.value!)
</script>
