<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-ingest-runs-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h1 class="legacy-h1">Ingest Runs</h1>
              <p class="legacy-muted">Inspect ingestion job runs.</p>
            </div>
            <div class="legacy-split">
              <NuxtLink class="legacy-button" to="/admin">Admin Home</NuxtLink>
              <button class="legacy-button" @click="refresh" :disabled="busy">Refresh</button>
            </div>
          </div>
        </section>

        <section class="legacy-card">
          <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
          <AdminTable
            testid="admin-ingest-runs-table"
            :columns="columns"
            :rows="runs"
            rowKey="id"
            emptyText="No ingest runs found."
          >
            <template #cell:summaryJson="{ value }">
              <code class="legacy-code-inline">{{ value ? String(value).slice(0, 120) : '-' }}</code>
            </template>
          </AdminTable>
        </section>
      </template>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import { createError } from 'h3'
import LegacyShell from '~/components/layout/LegacyShell.vue'
import AdminTable from '~/components/admin/AdminTable.vue'

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

type IngestRunRow = {
  id: number
  jobName: string
  sourceName: string | null
  startedAt: string
  finishedAt: string | null
  status: string
  summaryJson: string | null
}

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')

const busy = ref(false)
const error = ref<string | null>(null)
const runs = ref<IngestRunRow[]>([])

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'jobName', label: 'Job', width: '200px' },
  { key: 'sourceName', label: 'Source', width: '140px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'startedAt', label: 'Started At' },
  { key: 'finishedAt', label: 'Finished At' },
  { key: 'summaryJson', label: 'Summary' },
]

async function refresh() {
  error.value = null
  busy.value = true
  try {
    const res = await $fetch<{ runs: IngestRunRow[] }>('/api/admin/ingest-runs', { headers: requestHeaders })
    runs.value = res.runs
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Fetch failed'
  } finally {
    busy.value = false
  }
}

if (isAdmin.value) {
  await refresh()
}
</script>

<style scoped>
.legacy-button {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: white;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.legacy-button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.legacy-code-inline {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}
</style>

