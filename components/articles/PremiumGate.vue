<template>
  <div>
    <slot v-if="access.allowed" />

    <div v-else class="legacy-gate" data-testid="premium-gate">
      <h2 class="legacy-h2">Premium Content</h2>
      <p class="legacy-muted">
        This article is gated. The public API redacts the body in Task 4, so only the teaser is available.
      </p>
      <p class="legacy-muted" v-if="access.reason">Reason: {{ access.reason }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  access: {
    visibility: string
    allowed: boolean
    reason: string | null
  }
}>()
</script>

