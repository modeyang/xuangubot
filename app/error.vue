<template>
  <div class="legacy-error">
    <h1>Something went wrong</h1>
    <p v-if="error?.statusCode">
      Status: {{ error.statusCode }}
    </p>
    <p v-if="error?.message">
      {{ error.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()
</script>

<style scoped>
.legacy-error {
  padding: 24px;
  color: #111;
}
</style>

