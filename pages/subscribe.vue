<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="subscribe-page">

      <!-- Plan details section -->
      <section class="legacy-card legacy-hero" v-if="plan">
        <h1 class="legacy-h1">{{ plan.name }}</h1>
        <p class="legacy-muted">
          {{ plan.durationDays }} days &nbsp;&middot;&nbsp;
          {{ formatPrice(plan.priceCents) }}
        </p>
      </section>

      <section class="legacy-card" v-if="!plan && !planError">
        <p class="legacy-muted">Loading plan...</p>
      </section>

      <section class="legacy-card" v-if="planError">
        <p class="legacy-muted" style="color:#a02a2a">
          Failed to load plan: {{ planError }}
        </p>
      </section>

      <!-- Logged-in: subscription status -->
      <section class="legacy-card" v-if="currentUser && plan">
        <div class="legacy-split legacy-split--baseline">
          <h2 class="legacy-h2">Subscription</h2>
        </div>

        <p v-if="subscriptionStatus.entitled" class="legacy-muted" style="color:#166534">
          Active &mdash; you have the {{ plan.name }} plan.
        </p>
        <p v-else class="legacy-muted">
          No active subscription.
        </p>

        <!-- Purchase flow -->
        <div class="legacy-stack" style="margin-top:16px" v-if="!subscriptionStatus.entitled">
          <button
            class="legacy-button legacy-button--primary"
            :disabled="purchaseBusy"
            @click="onPurchase"
          >
            {{ purchaseBusy ? 'Processing...' : `Purchase for ${formatPrice(plan.priceCents)}` }}
          </button>
          <p class="legacy-muted" v-if="purchaseError" style="color:#a02a2a">{{ purchaseError }}</p>
          <p class="legacy-muted" v-if="purchaseSuccess">Payment complete! Your subscription is now active.</p>
        </div>
      </section>

      <!-- Not logged in: show login form -->
      <section class="legacy-card" v-if="!currentUser && plan">
        <div class="legacy-split legacy-split--baseline">
          <h2 class="legacy-h2">Login to purchase</h2>
        </div>
        <p class="legacy-muted" style="margin-bottom:16px">
          Please log in or create an account to purchase the {{ plan.name }} plan.
        </p>
        <LoginForm @logged-in="onLoggedIn" />
      </section>

      <!-- Success confirmation -->
      <section class="legacy-card" v-if="purchaseSuccess && currentUser">
        <h2 class="legacy-h2" style="color:#166534">Purchase Complete</h2>
        <p class="legacy-muted">
          Thank you! Your {{ plan?.name }} subscription is now active.
        </p>
      </section>

    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import LegacyShell from '~/components/layout/LegacyShell.vue'
import LoginForm from '~/components/auth/LoginForm.vue'

const sessionToken = useCookie<string | null>('xgt_session_token')

// ── Plan ──────────────────────────────────────────────────────────────────────

type Plan = {
  planCode: string
  name: string
  durationDays: number
  priceCents: number
  enabled: number
}

const { data: planData, error: planError } = await useFetch<{ plan: Plan }>('/api/plans', {
  key: 'subscribe-plan',
})

const plan = computed(() => planData.value?.plan ?? null)

// ── Auth state ───────────────────────────────────────────────────────────────

const { data: meData, refresh: refreshMe } = await useFetch('/api/me', {
  key: 'subscribe-me',
  headers: useRequestHeaders(['cookie']),
})

const currentUser = computed(() => meData.value?.user ?? null)

// ── Subscription status ──────────────────────────────────────────────────────

const subscriptionStatus = ref({ entitled: false })

watch(
  [currentUser, plan],
  async ([user, p]) => {
    if (!user || !p) return
    try {
      const result = await $fetch<{ hasActiveSubscription: boolean }>('/api/me/subscription', {
        headers: useRequestHeaders(['cookie']),
      })
      subscriptionStatus.value = { entitled: result.hasActiveSubscription }
    } catch {
      subscriptionStatus.value = { entitled: false }
    }
  },
  { immediate: true },
)

// ── Purchase flow ───────────────────────────────────────────────────────────

const purchaseBusy = ref(false)
const purchaseError = ref<string | null>(null)
const purchaseSuccess = ref(false)

async function onPurchase() {
  if (!plan.value || !currentUser.value) return
  purchaseBusy.value = true
  purchaseError.value = null
  purchaseSuccess.value = false
  try {
    // Step 1: create order
    const order = await $fetch<{ id: number }>('/api/orders', {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: { planCode: plan.value.planCode },
    })

    // Step 2: create mock payment session
    const paymentSession = await $fetch<{ paymentToken: string }>('/api/payments/mock/create', {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: { orderId: order.id },
    })

    // Step 3: complete mock payment
    await $fetch('/api/payments/mock/complete', {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: { orderId: order.id },
    })

    purchaseSuccess.value = true
    await refreshMe()
  } catch (err: any) {
    purchaseError.value = err?.data?.message ?? err?.statusMessage ?? 'Purchase failed'
  } finally {
    purchaseBusy.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

async function onLoggedIn() {
  await refreshMe()
  await navigateTo('/')
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
</style>
