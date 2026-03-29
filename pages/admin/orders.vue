<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-orders-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h1 class="legacy-h1">Orders</h1>
              <p class="legacy-muted">Inspect mock billing orders.</p>
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
            testid="admin-orders-table"
            :columns="columns"
            :rows="orders"
            rowKey="id"
            emptyText="No orders found."
          />
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

type OrderRow = {
  id: number
  status: string
  provider: string
  amountCents: number
  providerOrderId: string | null
  createdAt: string
  paidAt: string | null
  userId: number
  userPhone: string
  planCode: string
}

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')

const busy = ref(false)
const error = ref<string | null>(null)
const orders = ref<OrderRow[]>([])

const columns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'planCode', label: 'Plan', width: '140px' },
  { key: 'amountCents', label: 'Amount', width: '120px' },
  { key: 'provider', label: 'Provider', width: '100px' },
  { key: 'providerOrderId', label: 'Provider Order ID', width: '160px' },
  { key: 'userPhone', label: 'User Phone', width: '160px' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'paidAt', label: 'Paid At' },
]

async function refresh() {
  error.value = null
  busy.value = true
  try {
    const res = await $fetch<{ orders: OrderRow[] }>('/api/admin/orders', { headers: requestHeaders })
    orders.value = res.orders
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
</style>

