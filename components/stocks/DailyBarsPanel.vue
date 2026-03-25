<template>
  <section class="legacy-card" aria-label="Daily bars">
    <div class="legacy-split legacy-split--baseline">
      <h2 class="legacy-h2">Daily Bars</h2>
      <p class="legacy-muted">Latest {{ dailyBars.length }}</p>
    </div>

    <div v-if="dailyBars.length === 0" class="legacy-muted">No daily bars yet.</div>

    <div v-else class="legacy-table-wrap">
      <table class="legacy-table">
        <thead>
          <tr>
            <th>Date</th>
            <th class="legacy-right">Open</th>
            <th class="legacy-right">High</th>
            <th class="legacy-right">Low</th>
            <th class="legacy-right">Close</th>
            <th class="legacy-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bar in dailyBars" :key="bar.tradeDate">
            <td>{{ bar.tradeDate }}</td>
            <td class="legacy-right">{{ fmt(bar.open) }}</td>
            <td class="legacy-right">{{ fmt(bar.high) }}</td>
            <td class="legacy-right">{{ fmt(bar.low) }}</td>
            <td class="legacy-right">{{ fmt(bar.close) }}</td>
            <td class="legacy-right">{{ fmtInt(bar.volume) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
type DailyBar = {
  tradeDate: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

const props = defineProps<{
  dailyBars?: DailyBar[]
}>()

const dailyBars = computed(() => props.dailyBars ?? [])

function fmt(value: number | null) {
  if (value === null) return '--'
  return value.toFixed(2)
}

function fmtInt(value: number | null) {
  if (value === null) return '--'
  return String(value)
}
</script>

