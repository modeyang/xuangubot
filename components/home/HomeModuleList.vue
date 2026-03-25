<template>
  <section class="legacy-stack" aria-label="Home modules">
    <div v-if="modules.length === 0" class="legacy-card">
      <h2 class="legacy-h2">Modules</h2>
      <p class="legacy-muted">No homepage modules configured yet.</p>
      <ul class="legacy-list">
        <li>
          <NuxtLink to="/stock/000001.html">Example stock</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/theme/18129294.html">Example theme</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/article/1261948.html">Example article</NuxtLink>
        </li>
      </ul>
    </div>

    <div v-else class="legacy-grid">
      <article v-for="m in modules" :key="m.id" class="legacy-card legacy-card--tight">
        <h2 class="legacy-h2">{{ m.title }}</h2>
        <p class="legacy-muted">Key: {{ m.moduleKey }}</p>
        <pre v-if="m.config" class="legacy-code">{{ stringify(m.config) }}</pre>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
type HomeModule = {
  id: number
  moduleKey: string
  title: string
  sortOrder: number
  config: unknown
}

const props = defineProps<{
  modules?: HomeModule[]
}>()

const modules = computed(() => props.modules ?? [])

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

