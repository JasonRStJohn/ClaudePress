<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
    <NuxtLink
      v-if="page > 1"
      :to="linkTo(page - 1)"
      class="px-3 py-2 text-sm rounded border border-slate-300 hover:border-brand-400 hover:text-brand-600"
    >
      ← Prev
    </NuxtLink>

    <span class="text-sm text-slate-500 px-3">
      Page {{ page }} of {{ totalPages }}
    </span>

    <NuxtLink
      v-if="page < totalPages"
      :to="linkTo(page + 1)"
      class="px-3 py-2 text-sm rounded border border-slate-300 hover:border-brand-400 hover:text-brand-600"
    >
      Next →
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
  basePath: string // e.g. '/blog'
}>()

const linkTo = (p: number) =>
  p === 1 ? props.basePath : `${props.basePath}?page=${p}`
</script>
