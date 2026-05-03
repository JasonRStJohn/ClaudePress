<template>
  <div class="prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-brand-900 prose-a:text-brand-600" v-html="html" />
</template>

<script setup lang="ts">
// Renders rich text from the PocketBase `editor` field.
//
// NOTE: PocketBase's editor field stores HTML and sanitizes on save.
// We trust it here because only authenticated editors can write it.
// If you expose editor fields to public writes, sanitize client-side too.
defineProps<{
  html: string | null | undefined
}>()
</script>
