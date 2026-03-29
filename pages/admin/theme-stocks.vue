<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-theme-stocks-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h1 class="legacy-h1">Theme Stocks</h1>
              <p class="legacy-muted">Review and correct theme-stock relations.</p>
            </div>
            <div class="legacy-split">
              <NuxtLink class="legacy-button" to="/admin">Admin Home</NuxtLink>
              <button class="legacy-button" @click="loadTheme" :disabled="busy || !themeIdInput.trim()">
                Load Theme
              </button>
            </div>
          </div>
        </section>

        <section class="legacy-card" aria-label="Theme selector">
          <label class="legacy-muted">Theme ID</label>
          <div class="legacy-split">
            <input v-model="themeIdInput" class="legacy-input" placeholder="18129294" inputmode="numeric" />
            <button class="legacy-button" @click="loadTheme" :disabled="busy || !themeIdInput.trim()">Load</button>
          </div>
          <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
        </section>

        <section v-if="theme" class="legacy-card" aria-label="Theme overview">
          <h2 class="legacy-h2">{{ theme.name }}</h2>
          <p class="legacy-muted">Slug: {{ theme.slug }} | ID: {{ theme.id }}</p>
          <p class="legacy-muted" v-if="theme.summary">{{ theme.summary }}</p>
        </section>

        <section v-if="theme" class="legacy-card" aria-label="Current relations">
          <div class="legacy-split legacy-split--baseline">
            <h2 class="legacy-h2">Current Stocks ({{ stocks.length }})</h2>
            <button class="legacy-button" @click="loadTheme" :disabled="busy">Refresh</button>
          </div>
          <AdminTable
            testid="admin-theme-stocks-table"
            :columns="stockColumns"
            :rows="stocks"
            rowKey="symbol"
            emptyText="No theme-stocks rows yet."
          />
        </section>

        <section v-if="theme" class="legacy-card" aria-label="Correction">
          <h2 class="legacy-h2">Manual Correction</h2>
          <p class="legacy-muted">
            Paste stock symbols, one per line (6 digits). This replaces all existing theme_stocks rows for the theme.
          </p>

          <textarea v-model="symbolsText" class="legacy-textarea" rows="8" placeholder="000001&#10;600519" />

          <div class="legacy-split">
            <button class="legacy-button legacy-button--primary" @click="applyCorrection" :disabled="busy">
              Replace Relations
            </button>
            <button class="legacy-button" @click="resyncFromSnapshot" :disabled="busy">
              Resync From Latest Snapshot
            </button>
          </div>

          <p class="legacy-muted" v-if="lastResult">
            Last result: applied={{ lastResult.appliedSymbols.length }} missing={{ lastResult.missingSymbols.length }}
            source={{ lastResult.source }}
          </p>
          <p class="legacy-muted" v-if="lastResult?.missingSymbols.length">
            Missing symbols: {{ lastResult.missingSymbols.join(', ') }}
          </p>
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

type Theme = { id: number; slug: string; name: string; summary: string | null }
type ThemeStockRow = {
  id: number
  symbol: string
  exchange: string
  name: string
  status: string
  industry: string | null
  score: number | null
  source: string | null
}

type SyncResult = {
  ok: true
  themeId: number
  appliedSymbols: string[]
  missingSymbols: string[]
  source: string
}

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')

const busy = ref(false)
const error = ref<string | null>(null)

const themeIdInput = ref('18129294')
const theme = ref<Theme | null>(null)
const stocks = ref<ThemeStockRow[]>([])

const symbolsText = ref('')
const lastResult = ref<SyncResult | null>(null)

const stockColumns = [
  { key: 'symbol', label: 'Symbol', width: '110px' },
  { key: 'exchange', label: 'Ex', width: '60px' },
  { key: 'name', label: 'Name' },
  { key: 'score', label: 'Score', width: '80px' },
  { key: 'source', label: 'Source', width: '120px' },
]

function parseSymbols(raw: string) {
  const valid: string[] = []
  const invalid: string[] = []
  for (const line of raw.split('\n')) {
    const s = line.trim()
    if (!s) continue
    if (/^[0-9]{6}$/.test(s)) valid.push(s)
    else invalid.push(s)
  }
  return { valid, invalid }
}

async function loadTheme() {
  const raw = themeIdInput.value.trim()
  const id = Number(raw)
  if (!Number.isFinite(id)) {
    error.value = 'Invalid theme id'
    return
  }

  error.value = null
  busy.value = true
  try {
    const res = await $fetch<{ theme: Theme; stocks: ThemeStockRow[] }>('/api/themes/' + id)
    theme.value = res.theme
    stocks.value = res.stocks as any
    symbolsText.value = stocks.value.map((s) => s.symbol).join('\n')
  } catch (err: any) {
    theme.value = null
    stocks.value = []
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Load failed'
  } finally {
    busy.value = false
  }
}

async function applyCorrection() {
  if (!theme.value) return
  const parsed = parseSymbols(symbolsText.value)
  if (parsed.invalid.length) {
    error.value = `Invalid symbols: ${parsed.invalid.join(', ')}`
    return
  }

  error.value = null
  busy.value = true
  try {
    const res = await $fetch<SyncResult>('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: requestHeaders,
      body: { action: 'correct', themeId: theme.value.id, symbols: parsed.valid, source: 'manual' },
    })
    lastResult.value = res
    await loadTheme()
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Update failed'
  } finally {
    busy.value = false
  }
}

async function resyncFromSnapshot() {
  if (!theme.value) return

  error.value = null
  busy.value = true
  try {
    const res = await $fetch<SyncResult>('/api/admin/theme-stocks/sync', {
      method: 'POST',
      headers: requestHeaders,
      body: { action: 'resync', themeId: theme.value.id },
    })
    lastResult.value = res
    await loadTheme()
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Resync failed'
  } finally {
    busy.value = false
  }
}

if (isAdmin.value) {
  await loadTheme()
}
</script>

<style scoped>
.legacy-input {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  background: white;
}
.legacy-textarea {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  background: white;
  resize: vertical;
}
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
.legacy-button--primary {
  background: #1f3a8a;
  border-color: #1f3a8a;
  color: white;
}
</style>
