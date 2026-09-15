<template>
  <div class="cp-safe-html" v-html="clean" />
</template>

<script setup lang="ts">
import { sanitize } from '../../utils/sanitize'

const props = defineProps<{ html?: string | null }>()

const clean = computed(() => sanitize(props.html))
</script>

<style>
/* Baseline flow for CMS HTML rendered outside `prose`. `:where()` keeps
   specificity at zero so a consumer's own classes (fonts, colors, spacing)
   still override. Fixes #98 (authored paragraph/line spacing collapsing) and
   #107 (links not visually distinct) on CpSafeHtml surfaces. */
.cp-safe-html :where(p, ul, ol, blockquote, pre) {
  margin-block: 0.75em;
}
.cp-safe-html :where(p, ul, ol, blockquote, pre):first-child { margin-block-start: 0; }
.cp-safe-html :where(p, ul, ol, blockquote, pre):last-child  { margin-block-end: 0; }
.cp-safe-html :where(ul) { list-style: disc; padding-inline-start: 1.25em; }
.cp-safe-html :where(ol) { list-style: decimal; padding-inline-start: 1.25em; }
.cp-safe-html :where(a) { color: #2563eb; text-decoration: underline; }
</style>
