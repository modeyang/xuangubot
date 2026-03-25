<template>
  <section class="legacy-card" aria-label="Theme summary">
    <div class="legacy-split">
      <div>
        <h1 class="legacy-h1">
          {{ theme.name }}
          <span class="legacy-muted">(#{{ theme.id }})</span>
        </h1>
        <p v-if="theme.summary" class="legacy-muted">{{ theme.summary }}</p>
        <p v-else class="legacy-muted">No summary.</p>
      </div>

      <div class="legacy-metric" v-if="snapshot">
        <div class="legacy-metric__label">Heat</div>
        <div class="legacy-metric__value">
          {{ snapshot.heatScore ?? '--' }}
          <span v-if="snapshot.rank !== null" class="legacy-pill">Rank {{ snapshot.rank }}</span>
        </div>
        <div class="legacy-metric__meta">Captured {{ snapshot.capturedAt }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type Theme = {
  id: number
  slug: string
  name: string
  summary: string | null
}

type Snapshot = {
  capturedAt: string
  heatScore: number | null
  rank: number | null
  payload: unknown
}

defineProps<{
  theme: Theme
  snapshot: Snapshot | null
}>()
</script>

