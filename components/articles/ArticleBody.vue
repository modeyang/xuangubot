<template>
  <article class="legacy-article" aria-label="Article body">
    <div v-if="article.bodyHtml" class="legacy-article__body" v-html="article.bodyHtml" />
    <pre v-else-if="article.bodyMarkdown" class="legacy-article__markdown">{{ article.bodyMarkdown }}</pre>
    <p v-else class="legacy-muted">Body not available.</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  article: {
    bodyHtml: string | null
    bodyMarkdown: string | null
  }
}>()
</script>

