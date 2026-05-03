<template>
  <section
    class="relative overflow-hidden"
    :class="tall ? 'py-24 md:py-32' : 'py-16 md:py-20'"
  >
    <div
      v-if="imageUrl"
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url('${imageUrl}')` }"
    />
    <div v-if="imageUrl" class="absolute inset-0 bg-black/40" />

    <div class="relative max-w-4xl mx-auto px-6 text-center" :class="imageUrl ? 'text-white' : 'text-brand-900'">
      <h1 class="font-serif text-4xl md:text-5xl font-bold mb-4">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="subtitle || $slots.subtitle" class="text-lg md:text-xl opacity-90">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
      <div v-if="$slots.actions" class="mt-8 flex flex-wrap justify-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  imageUrl?: string | null
  tall?: boolean
}>()
</script>
