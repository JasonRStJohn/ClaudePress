<template>
  <!-- Thin alias: delegates to CpSafeHtml so there is ONE sanitized, flow-styled
       implementation. A consumer's `class` falls through to CpSafeHtml's root
       (merging with `cp-safe-html`), so site typography still overrides. -->
  <CpSafeHtml :html="html" />
</template>

<script setup lang="ts">
defineProps<{ html?: string | null }>()
</script>
