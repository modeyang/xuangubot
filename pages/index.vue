<template>
  <LegacyShell>
    <div data-testid="legacy-home">
      <section class="legacy-hero legacy-card">
        <h1 class="legacy-h1">Xuangutong MVP</h1>
        <p class="legacy-muted">Legacy routes are preserved and rendered via Nuxt pages.</p>
      </section>

      <div v-if="pending" class="legacy-card">Loading…</div>
      <HomeModuleList v-else :modules="modules" />
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import LegacyShell from '~/components/layout/LegacyShell.vue'
import HomeModuleList from '~/components/home/HomeModuleList.vue'

type HomeModule = {
  id: number
  moduleKey: string
  title: string
  sortOrder: number
  config: unknown
}

const { data, pending } = useFetch<{ modules: HomeModule[] }>('/api/home')
const modules = computed(() => data.value?.modules ?? [])
</script>
