<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="login-page">
      <section class="legacy-card legacy-hero">
        <h1 class="legacy-h1">Login</h1>
        <p class="legacy-muted">Beta login via fake SMS code.</p>
      </section>

      <LoginForm />
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import LegacyShell from '~/components/layout/LegacyShell.vue'
import LoginForm from '~/components/auth/LoginForm.vue'
</script>

