<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-index-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <h1 class="legacy-h1">Admin</h1>
          <p class="legacy-muted">Internal tools (Task 8).</p>
        </section>

        <section class="legacy-card" aria-label="Admin modules">
          <h2 class="legacy-h2">Tools</h2>
          <ul class="legacy-list">
            <li><NuxtLink to="/admin/articles">Articles</NuxtLink></li>
            <li><NuxtLink to="/admin/homepage-modules">Homepage Modules</NuxtLink></li>
            <li><NuxtLink to="/admin/theme-stocks">Theme Stocks</NuxtLink></li>
            <li><NuxtLink to="/admin/orders">Orders</NuxtLink></li>
            <li><NuxtLink to="/admin/ingest-runs">Ingest Runs</NuxtLink></li>
            <li><NuxtLink to="/admin/beta-access">Beta Access</NuxtLink></li>
          </ul>
        </section>
      </template>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import { createError } from 'h3'
import LegacyShell from '~/components/layout/LegacyShell.vue'

definePageMeta({
  middleware: [
    async () => {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const me = await $fetch<{ user: { role: string } | null }>('/api/me', { headers }).catch(() => ({ user: null }))
      if (me.user?.role !== 'admin') {
        if (import.meta.server) {
          throw createError({ statusCode: 403, statusMessage: 'admin only' })
        }
        return navigateTo('/login')
      }
    },
  ],
})

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')
</script>

