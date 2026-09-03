<template>
  <div v-html="clean" />
</template>

<script setup lang="ts">
import { sanitize } from '../../utils/sanitize'

const props = defineProps<{ html?: string | null }>()

const clean = computed(() => sanitize(props.html))
</script>
