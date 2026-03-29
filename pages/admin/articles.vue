<template>
  <LegacyShell>
    <div class="legacy-stack" data-testid="admin-articles-page">
      <section v-if="!isAdmin" class="legacy-card legacy-hero" aria-label="Forbidden">
        <h1 class="legacy-h1">Forbidden</h1>
        <p class="legacy-muted">Admin access required.</p>
      </section>

      <template v-else>
        <section class="legacy-card legacy-hero">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h1 class="legacy-h1">Articles</h1>
              <p class="legacy-muted">Publish/unpublish by article ID.</p>
            </div>
            <div class="legacy-split">
              <NuxtLink class="legacy-button" to="/admin">Admin Home</NuxtLink>
              <button class="legacy-button" @click="loadArticle" :disabled="busy || !articleIdInput.trim()">
                Load
              </button>
            </div>
          </div>
        </section>

        <section class="legacy-card" aria-label="Article selector">
          <label class="legacy-muted">Article ID</label>
          <div class="legacy-split">
            <input v-model="articleIdInput" class="legacy-input" placeholder="1261948" inputmode="numeric" />
            <button class="legacy-button" @click="loadArticle" :disabled="busy || !articleIdInput.trim()">Load</button>
          </div>
          <p class="legacy-muted" v-if="error" style="color: #a02a2a">{{ error }}</p>
        </section>

        <section v-if="article" class="legacy-card" aria-label="Article overview">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h2 class="legacy-h2">{{ article.title }}</h2>
              <p class="legacy-muted">
                ID: {{ article.id }} | slug: {{ article.slug }} | type: {{ article.articleType }} | visibility:
                {{ article.visibility }} | status: {{ article.status }}
              </p>
              <p class="legacy-muted" v-if="article.publishedAt">publishedAt: {{ article.publishedAt }}</p>
            </div>
            <div class="legacy-split">
              <button class="legacy-button legacy-button--primary" @click="publish" :disabled="busy">Publish</button>
              <button class="legacy-button" @click="unpublish" :disabled="busy">Unpublish</button>
            </div>
          </div>

          <p class="legacy-muted" v-if="article.excerpt">Excerpt: {{ article.excerpt }}</p>
          <p class="legacy-muted">
            Note: this screen uses the public `/api/articles/:id` read endpoint. Premium bodies are intentionally redacted.
          </p>
        </section>

        <section v-else-if="articleIdNumber !== null" class="legacy-card" aria-label="Article actions">
          <div class="legacy-split legacy-split--baseline">
            <div>
              <h2 class="legacy-h2">Article ID {{ articleIdNumber }}</h2>
              <p class="legacy-muted">
                Public read did not return an article. This may be a draft/unpublished row, but publish and
                unpublish controls remain available by ID.
              </p>
            </div>
            <div class="legacy-split">
              <button class="legacy-button legacy-button--primary" @click="publish" :disabled="busy">Publish</button>
              <button class="legacy-button" @click="unpublish" :disabled="busy">Unpublish</button>
            </div>
          </div>
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

type Article = {
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
  sourceRef: string | null
}

const requestHeaders = useRequestHeaders(['cookie'])
const { data: me } = await useFetch<{ user: { role: string } | null }>('/api/me', { headers: requestHeaders })
const isAdmin = computed(() => me.value?.user?.role === 'admin')

const busy = ref(false)
const error = ref<string | null>(null)

const articleIdInput = ref('1261948')
const article = ref<Article | null>(null)

const articleIdNumber = computed(() => {
  const raw = articleIdInput.value.trim()
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
})

async function loadArticle() {
  if (articleIdNumber.value === null) {
    error.value = 'Invalid article id'
    return
  }

  error.value = null
  busy.value = true
  try {
    const res = await $fetch<{ article: Article }>('/api/articles/' + articleIdNumber.value)
    article.value = res.article
  } catch (err: any) {
    article.value = null
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Load failed'
  } finally {
    busy.value = false
  }
}

async function publish() {
  if (articleIdNumber.value === null) return
  error.value = null
  busy.value = true
  try {
    await $fetch(`/api/admin/articles/${articleIdNumber.value}/publish`, {
      method: 'POST',
      headers: requestHeaders,
      body: {},
    })
    await loadArticle()
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Publish failed'
  } finally {
    busy.value = false
  }
}

async function unpublish() {
  if (articleIdNumber.value === null) return
  error.value = null
  busy.value = true
  try {
    await $fetch(`/api/admin/articles/${articleIdNumber.value}/unpublish`, {
      method: 'POST',
      headers: requestHeaders,
    })
    await loadArticle()
  } catch (err: any) {
    error.value = err?.statusMessage ?? err?.data?.message ?? 'Unpublish failed'
  } finally {
    busy.value = false
  }
}

if (isAdmin.value) {
  await loadArticle()
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
