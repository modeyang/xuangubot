<template>
  <LegacyShell>
    <div data-testid="legacy-article-page" class="legacy-stack">
      <div v-if="pending" class="legacy-card">Loading…</div>
      <div v-else-if="error" class="legacy-card">
        <h1 class="legacy-h1">Article</h1>
        <p class="legacy-muted">Failed to load article: {{ error.message }}</p>
      </div>

      <template v-else>
        <section class="legacy-card legacy-article-head">
          <h1 class="legacy-h1">{{ articleData.article.title }}</h1>
          <p class="legacy-muted">
            <span v-if="articleData.article.sourceName">Source: {{ articleData.article.sourceName }}</span>
            <span v-if="articleData.article.publishedAt"> · {{ articleData.article.publishedAt }}</span>
          </p>
          <p v-if="articleData.article.excerpt" class="legacy-lead">
            {{ articleData.article.excerpt }}
          </p>
        </section>

        <PremiumGate :access="articleData.access">
          <section class="legacy-card">
            <ArticleBody :article="articleData.article" />
          </section>
        </PremiumGate>

        <section class="legacy-card" aria-label="Related">
          <h2 class="legacy-h2">Related</h2>
          <div class="legacy-grid legacy-grid--2">
            <div>
              <h3 class="legacy-h3">Stocks</h3>
              <ul v-if="articleData.relatedStocks.length" class="legacy-list">
                <li v-for="s in articleData.relatedStocks" :key="String(s.symbol)">
                  <NuxtLink :to="`/stock/${s.symbol}.html`">
                    {{ s.symbol }}
                    <span class="legacy-muted" v-if="s.name">· {{ s.name }}</span>
                  </NuxtLink>
                </li>
              </ul>
              <p v-else class="legacy-muted">None.</p>
            </div>
            <div>
              <h3 class="legacy-h3">Themes</h3>
              <ul v-if="articleData.relatedThemes.length" class="legacy-list">
                <li v-for="t in articleData.relatedThemes" :key="t.id">
                  <NuxtLink :to="`/theme/${t.id}.html`">{{ t.name }}</NuxtLink>
                </li>
              </ul>
              <p v-else class="legacy-muted">None.</p>
            </div>
          </div>
        </section>
      </template>
    </div>
  </LegacyShell>
</template>

<script setup lang="ts">
import ArticleBody from '~/components/articles/ArticleBody.vue'
import PremiumGate from '~/components/articles/PremiumGate.vue'
import LegacyShell from '~/components/layout/LegacyShell.vue'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

type ArticleApiResponse = {
  article: {
    id: number
    slug: string
    title: string
    excerpt: string | null
    bodyMarkdown: string | null
    bodyHtml: string | null
    articleType: string
    visibility: string
    status: string
    coverUrl: string | null
    publishedAt: string | null
    sourceName: string | null
  }
  access: { visibility: string; allowed: boolean; reason: string | null }
  relatedStocks: Array<{ symbol: string; name: string | null }>
  relatedThemes: Array<{ id: number; name: string }>
}

const { data, pending, error } = useFetch<ArticleApiResponse>(() => `/api/articles/${encodeURIComponent(id.value)}`)
const articleData = computed(() => data.value!)
</script>
