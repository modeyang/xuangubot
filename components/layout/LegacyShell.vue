<template>
  <div class="legacy-root legacy-backdrop" data-testid="legacy-shell">
    <header class="legacy-nav">
      <div class="legacy-nav__content">
        <NuxtLink to="/" class="legacy-logo" aria-label="Xuangutong Home">
          Xuangutong
        </NuxtLink>
        <nav class="legacy-nav__links" aria-label="Primary">
          <NuxtLink to="/" class="legacy-nav__link">Home</NuxtLink>
          <NuxtLink to="/ts/home" class="legacy-nav__link">TS</NuxtLink>
          <NuxtLink to="/zzd/home" class="legacy-nav__link">ZZD</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="legacy-main">
      <slot />
    </main>

    <footer class="legacy-footer">
      <div class="legacy-footer__content">
        <span>Legacy public routes (Task 5)</span>
      </div>
    </footer>
  </div>
</template>
