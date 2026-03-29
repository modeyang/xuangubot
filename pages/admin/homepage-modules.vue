<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-homepage-modules-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h1 class="legacy-h1">Homepage Modules</h1>
              <p class="legacy-muted">Enable/disable, reorder, and edit validated configs.</p>
            </div>
            <div class="legacy-split">
              <NuxtLink class="legacy-button" to="/admin">Admin Home</NuxtLink>
              <button class="legacy-button" @click="refresh" :disabled="busy">Refresh</button>
            </div>
          </div>
        </section>

        <section class="legacy-card" aria-label="Modules list">
          <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
          <AdminTable
            testid="admin-homepage-modules-table"
            :columns="columns"
            :rows="modules"
            rowKey="id"
            emptyText="No modules found."
          >
            <template #cell:enabled="{ row }">
              <span v-if="row.enabled">enabled</span>
              <span v-else class="legacy-muted">disabled</span>
            </template>

            <template #cell:actions="{ row }">
              <div class="legacy-split">
                <button class="legacy-button" @click="onToggle(row)" :disabled="busy">
                  {{ row.enabled ? 'Disable' : 'Enable' }}
                </button>
                <button class="legacy-button" @click="select(row)" :disabled="busy">Edit</button>
                <button class="legacy-button" @click="move(row, -1)" :disabled="busy">Up</button>
                <button class="legacy-button" @click="move(row, 1)" :disabled="busy">Down</button>
              </div>
            </template>
          </AdminTable>
        </section>

        <section v-if="selected" class="legacy-card" aria-label="Edit module">
          <div class="legacy-split legacy-split--baseline">
            <h2 class="legacy-h2">Edit: {{ selected.title }}</h2>
            <button class="legacy-button" @click="selected = null" :disabled="busy">Close</button>
          </div>

          <div class="legacy-stack">
            <label class="legacy-muted">Title</label>
            <input v-model="editTitle" class="legacy-input" />
            <button class="legacy-button legacy-button--primary" @click="saveTitle" :disabled="busy || !editTitle.trim()">
              Save Title
            </button>

            <label class="legacy-muted">Config (JSON, validated by module key)</label>
            <textarea v-model="editConfigJson" class="legacy-textarea" rows="10" />
            <button class="legacy-button legacy-button--primary" @click="saveConfig" :disabled="busy">
              Save Config
            </button>
          </div>
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

type HomeModuleRow = {
  id: number
  moduleKey: string
  title: string
  configJson: string | null
  sortOrder: number | null
  enabled: boolean
}

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')

const busy = ref(false)
const error = ref<string | null>(null)
const modules = ref<HomeModuleRow[]>([])

const selected = ref<HomeModuleRow | null>(null)
const editTitle = ref('')
const editConfigJson = ref('')

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'moduleKey', label: 'Key', width: '180px' },
  { key: 'title', label: 'Title' },
  { key: 'sortOrder', label: 'Sort', width: '80px' },
  { key: 'enabled', label: 'Status', width: '100px' },
  { key: 'actions', label: 'Actions', width: '360px' },
]

function safeParseJson(raw: string) {
  try {
    return { ok: true as const, value: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false as const, value: null }
  }
}

async function callAdmin(body: any) {
  return await $fetch<{ modules: HomeModuleRow[] }>('/api/admin/homepage-modules', {
    method: 'POST',
    headers: requestHeaders,
    body,
  })
}

async function refresh() {
  error.value = null
  busy.value = true
  try {
    const res = await callAdmin({ action: 'list' })
    modules.value = res.modules
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Fetch failed'
  } finally {
    busy.value = false
  }
}

function select(row: HomeModuleRow) {
  selected.value = row
  editTitle.value = row.title
  editConfigJson.value = row.configJson ?? ''
}

async function onToggle(row: HomeModuleRow) {
  error.value = null
  busy.value = true
  try {
    const res = await callAdmin({ action: 'setEnabled', id: row.id, enabled: !row.enabled })
    modules.value = res.modules
    if (selected.value?.id === row.id) {
      selected.value = res.modules.find((m) => m.id === row.id) ?? null
    }
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Update failed'
  } finally {
    busy.value = false
  }
}

async function move(row: HomeModuleRow, delta: number) {
  const idx = modules.value.findIndex((m) => m.id === row.id)
  if (idx < 0) return
  const next = idx + delta
  if (next < 0 || next >= modules.value.length) return

  const copy = modules.value.slice()
  const [item] = copy.splice(idx, 1)
  copy.splice(next, 0, item!)

  error.value = null
  busy.value = true
  try {
    const res = await callAdmin({ action: 'reorder', orderedIds: copy.map((m) => m.id) })
    modules.value = res.modules
    if (selected.value) {
      selected.value = res.modules.find((m) => m.id === selected.value!.id) ?? null
    }
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Reorder failed'
  } finally {
    busy.value = false
  }
}

async function saveTitle() {
  if (!selected.value) return
  const title = editTitle.value.trim()
  if (!title) return

  error.value = null
  busy.value = true
  try {
    const res = await callAdmin({ action: 'setTitle', id: selected.value.id, title })
    modules.value = res.modules
    selected.value = res.modules.find((m) => m.id === selected.value!.id) ?? null
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Save failed'
  } finally {
    busy.value = false
  }
}

async function saveConfig() {
  if (!selected.value) return
  const parsed = safeParseJson(editConfigJson.value)
  if (!parsed.ok) {
    error.value = 'Invalid JSON'
    return
  }

  error.value = null
  busy.value = true
  try {
    const res = await callAdmin({ action: 'setConfig', id: selected.value.id, config: parsed.value })
    modules.value = res.modules
    selected.value = res.modules.find((m) => m.id === selected.value!.id) ?? null
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Save failed'
  } finally {
    busy.value = false
  }
}

if (isAdmin.value) {
  await refresh()
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

