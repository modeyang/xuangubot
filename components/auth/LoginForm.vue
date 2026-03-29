<template>
  <section class="legacy-card" aria-label="Login">
    <div class="legacy-split legacy-split--baseline">
      <h2 class="legacy-h2">Login</h2>
      <p class="legacy-muted">Fake SMS OTP (beta)</p>
    </div>

    <form class="legacy-stack" @submit.prevent="onVerify">
      <label class="legacy-stack" style="gap: 6px">
        <span class="legacy-muted">Phone</span>
        <input
          v-model="phone"
          class="legacy-input"
          inputmode="tel"
          autocomplete="tel"
          placeholder="15500009001"
        />
      </label>

      <div class="legacy-split">
        <button type="button" class="legacy-button" :disabled="busy" @click="onRequestCode">
          Request code
        </button>
        <span class="legacy-muted" v-if="requestedAt">
          Requested at {{ new Date(requestedAt).toLocaleTimeString() }}
        </span>
      </div>

      <label class="legacy-stack" style="gap: 6px">
        <span class="legacy-muted">Code</span>
        <input
          v-model="code"
          class="legacy-input"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="6-digit code"
        />
      </label>

      <button type="submit" class="legacy-button legacy-button--primary" :disabled="busy">
        Verify and login
      </button>

      <p class="legacy-muted" v-if="message">{{ message }}</p>
      <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
const phone = ref('')
const code = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const requestedAt = ref<string | null>(null)

async function onRequestCode() {
  busy.value = true
  error.value = null
  message.value = null
  try {
    await $fetch('/api/auth/request-code', {
      method: 'POST',
      body: { phone: phone.value },
    })
    requestedAt.value = new Date().toISOString()
    message.value = 'Code requested. If you are allowlisted, ask an admin for the debug code.'
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Request failed'
  } finally {
    busy.value = false
  }
}

async function onVerify() {
  busy.value = true
  error.value = null
  message.value = null
  try {
    await $fetch('/api/auth/verify-code', {
      method: 'POST',
      body: { phone: phone.value, code: code.value },
    })
    message.value = 'Logged in.'
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Verify failed'
  } finally {
    busy.value = false
  }
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

