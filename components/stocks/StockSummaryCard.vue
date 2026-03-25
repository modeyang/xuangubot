<template>
  <section class="legacy-card" aria-label="Stock summary">
    <div class="legacy-split">
      <div>
        <h1 class="legacy-h1">
          {{ stock.name || stock.symbol }}
          <span class="legacy-muted">({{ stock.symbol }})</span>
        </h1>
        <p class="legacy-muted">
          Exchange: {{ stock.exchange }}
          <span v-if="stock.industry">· Industry: {{ stock.industry }}</span>
        </p>
      </div>

      <div class="legacy-metric" v-if="quote">
        <div class="legacy-metric__label">Last</div>
        <div class="legacy-metric__value">
          {{ fmtPrice(quote.lastPrice) }}
          <span
            v-if="quote.pctChange !== null"
            class="legacy-pill"
            :class="quote.pctChange >= 0 ? 'legacy-pill--up' : 'legacy-pill--down'"
          >
            {{ fmtPct(quote.pctChange) }}
          </span>
        </div>
        <div class="legacy-metric__meta">Quoted at {{ fmtTime(quote.quotedAt) }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type Stock = {
  symbol: string
  exchange: string
  name: string | null
  status: string | null
  industry: string | null
}

type Quote = {
  quotedAt: string
  lastPrice: number | null
  pctChange: number | null
  turnover: number | null
  volume: number | null
}

defineProps<{
  stock: Stock
  quote: Quote | null
}>()

function fmtPrice(value: number | null) {
  if (value === null) return '--'
  return value.toFixed(2)
}

function fmtPct(value: number | null) {
  if (value === null) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function fmtTime(iso: string) {
  // Keep it stable for SSR: ISO in, ISO-ish out.
  return iso.replace('T', ' ').replace('.000Z', 'Z')
}
</script>

