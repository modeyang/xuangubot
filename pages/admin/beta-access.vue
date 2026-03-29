<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-beta-access-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
      <section class="legacy-card legacy-hero">
        <h1 class="legacy-h1">Beta Access</h1>
        <p class="legacy-muted">Manage allowlisted phones and view latest debug OTP codes.</p>
      </section>

      <section class="legacy-card" aria-label="Add phone">
        <div class="legacy-split legacy-split--baseline">
          <h2 class="legacy-h2">Allowlist</h2>
          <button class="legacy-button" @click="refreshAll" :disabled="busy">Refresh</button>
        </div>

        <form class="legacy-split" @submit.prevent="onAdd">
          <input v-model="newPhone" class="legacy-input" inputmode="tel" placeholder="15500009001" />
          <button class="legacy-button legacy-button--primary" type="submit" :disabled="busy || !newPhone">
            Add
          </button>
        </form>

        <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
      </section>

      <section class="legacy-card" aria-label="Allowlisted phones">
        <h2 class="legacy-h2">Phones</h2>
        <table class="legacy-table" v-if="phones.length">
          <thead>
            <tr>
              <th>Phone</th>
              <th>Status</th>
              <th>Latest Code</th>
              <th>Code Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in phones" :key="p.phone">
              <td>{{ p.phone }}</td>
              <td>
                <span v-if="p.enabled">enabled</span>
                <span v-else class="legacy-muted">disabled</span>
              </td>
              <td>
                <code v-if="latestByPhone[p.phone]">{{ latestByPhone[p.phone]!.codePlain }}</code>
                <span v-else class="legacy-muted">-</span>
              </td>
              <td>
                <span v-if="latestByPhone[p.phone]">{{ latestByPhone[p.phone]!.createdAt }}</span>
                <span v-else class="legacy-muted">-</span>
              </td>
              <td>
                <div class="legacy-split">
                  <button class="legacy-button" @click="onToggle(p.phone, p.enabled)" :disabled="busy">
                    {{ p.enabled ? 'Disable' : 'Enable' }}
                  </button>
                  <button class="legacy-button" @click="onRemove(p.phone)" :disabled="busy">Remove</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="legacy-muted">No allowlisted phones yet.</p>
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

type BetaPhone = { phone: string; enabled: 0 | 1; createdAt: string; createdBy: number | null }
type DebugCode = { phone: string; codePlain: string; createdAt: string }

const busy = ref(false)
const error = ref<string | null>(null)
const newPhone = ref('')

const phones = ref<BetaPhone[]>([])
const debugCodes = ref<DebugCode[]>([])

const latestByPhone = computed<Record<string, DebugCode>>(() => {
  const out: Record<string, DebugCode> = {}
  for (const d of debugCodes.value) out[d.phone] = d
  return out
})

async function refreshAll() {
  error.value = null
  busy.value = true
  try {
    const res = await $fetch<{ phones: BetaPhone[]; debugCodes: DebugCode[] }>('/api/admin/beta-access', {
      headers: requestHeaders,
    })
    phones.value = res.phones
    debugCodes.value = res.debugCodes
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Fetch failed'
  } finally {
    busy.value = false
  }
}

async function mutate(action: 'add' | 'enable' | 'disable' | 'remove', phone: string) {
  error.value = null
  busy.value = true
  try {
    await $fetch('/api/admin/beta-access', {
      method: 'POST',
      headers: requestHeaders,
      body: { action, phone },
    })
    await refreshAll()
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Update failed'
  } finally {
    busy.value = false
  }
}

async function onAdd() {
  const p = newPhone.value.trim()
  if (!p) return
  newPhone.value = ''
  await mutate('add', p)
}

async function onToggle(phone: string, enabled: 0 | 1) {
  await mutate(enabled ? 'disable' : 'enable', phone)
}

async function onRemove(phone: string) {
  await mutate('remove', phone)
}

if (isAdmin.value) {
  await refreshAll()
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
.legacy-table {
  width: 100%;
  border-collapse: collapse;
}
.legacy-table th,
.legacy-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: left;
}
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
