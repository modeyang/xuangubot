<template>
  <LegacyShell>
    <div data-testid="legacy-stock-page" class="legacy-stack">
      <div v-if="pending" class="legacy-card">Loading…</div>
      <div v-else-if="error" class="legacy-card">
        <h1 class="legacy-h1">Stock</h1>
        <p class="legacy-muted">Failed to load stock: {{ error.message }}</p>
      </div>

      <template v-else>
        <StockSummaryCard :stock="stockData.stock" :quote="stockData.quote" />
        <DailyBarsPanel :daily-bars="barsData.dailyBars" />

        <section class="legacy-card" aria-label="Related themes">
          <h2 class="legacy-h2">Themes</h2>
          <ul v-if="stockData.themes.length" class="legacy-list">
            <li v-for="t in stockData.themes" :key="t.id">
              <NuxtLink :to="`/theme/${t.id}.html`">{{ t.name }}</NuxtLink>
              <span v-if="t.score !== null" class="legacy-muted"> · score {{ t.score }}</span>
            </li>
          </ul>
          <p v-else class="legacy-muted">No themes.</p>
        </section>

        <section class="legacy-card" aria-label="Related articles">
          <h2 class="legacy-h2">Articles</h2>
          <ul v-if="stockData.articles.length" class="legacy-list">
            <li v-for="a in stockData.articles" :key="a.id">
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
import DailyBarsPanel from '~/components/stocks/DailyBarsPanel.vue'
import StockSummaryCard from '~/components/stocks/StockSummaryCard.vue'

const route = useRoute()
const symbol = computed(() => String(route.params.symbol ?? ''))

type StockApiResponse = {
  stock: { symbol: string; exchange: string; name: string | null; status: string | null; industry: string | null }
  quote: { quotedAt: string; lastPrice: number | null; pctChange: number | null; turnover: number | null; volume: number | null } | null
  themes: Array<{ id: number; name: string; score: number | null }>
  articles: Array<{ id: number; title: string; publishedAt: string | null }>
  announcements: Array<Record<string, unknown>>
}

type DailyBarsResponse = {
  symbol: string
  dailyBars: Array<{
    tradeDate: string
    open: number | null
    high: number | null
    low: number | null
    close: number | null
    volume: number | null
  }>
}

const { data: stock, pending, error } = useFetch<StockApiResponse>(() => `/api/stocks/${encodeURIComponent(symbol.value)}`)
const { data: bars } = useFetch<DailyBarsResponse>(() => `/api/stocks/${encodeURIComponent(symbol.value)}/daily-bars?limit=120`)

const stockData = computed(() => stock.value!)
const barsData = computed(() => bars.value ?? { symbol: symbol.value, dailyBars: [] })
</script>
