<template>
  <div class="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-brand-900 prose-a:text-brand-600" v-html="clean" />
</template>

<script setup lang="ts">
import { sanitize } from '../../utils/sanitize'

const props = defineProps<{
  html: string | null | undefined
}>()

const clean = computed(() => sanitize(props.html))
</script>
