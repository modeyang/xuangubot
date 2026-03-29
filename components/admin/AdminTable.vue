<template>
  <table class="legacy-table" :data-testid="testid">
    <thead>
      <tr>
        <th v-for="c in columns" :key="c.key" :style="c.width ? { width: c.width } : undefined">
          {{ c.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="rows.length === 0">
        <td :colspan="columns.length" class="legacy-muted">
          {{ emptyText }}
        </td>
      </tr>
      <tr v-for="r in rows" :key="rowKeyValue(r)">
        <td v-for="c in columns" :key="c.key">
          <slot :name="`cell:${c.key}`" :row="r" :value="(r as any)[c.key]">
            <span>{{ formatValue((r as any)[c.key]) }}</span>
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
type Column = {
  key: string
  label: string
  width?: string
}

const props = defineProps<{
  columns: Column[]
  rows: any[]
  rowKey?: string
  emptyText?: string
  testid?: string
}>()

const emptyText = computed(() => props.emptyText ?? 'No rows.')

function rowKeyValue(row: any) {
  if (props.rowKey && row && typeof row === 'object') return String(row[props.rowKey])
  return JSON.stringify(row)
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>

