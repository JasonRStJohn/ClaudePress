<template>
  <header class="border-b border-slate-200 bg-white sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-3">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="settings?.site_name || 'Home'"
          class="h-10 w-auto"
        />
        <span class="font-serif text-xl font-bold text-brand-800">
          {{ settings?.site_name || 'ClaudePress' }}
        </span>
      </NuxtLink>

      <button
        class="md:hidden text-slate-600"
        @click="open = !open"
        :aria-expanded="open"
        aria-label="Toggle menu"
      >
        <span class="block w-6 h-0.5 bg-current mb-1.5"></span>
        <span class="block w-6 h-0.5 bg-current mb-1.5"></span>
        <span class="block w-6 h-0.5 bg-current"></span>
      </button>

      <nav class="hidden md:flex items-center gap-6">
        <template v-for="item in nav" :key="item.id">
          <a
            v-if="item.external"
            :href="item.href"
            target="_blank"
            rel="noopener"
            class="text-sm font-medium text-slate-700 hover:text-brand-600 transition"
          >
            {{ item.label }}
          </a>
          <NuxtLink
            v-else
            :to="item.href"
            class="text-sm font-medium text-slate-700 hover:text-brand-600 transition"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>
    </div>

    <nav
      v-if="open"
      class="md:hidden border-t border-slate-200 bg-white px-6 py-4 flex flex-col gap-3"
    >
      <template v-for="item in nav" :key="item.id">
        <a
          v-if="item.external"
          :href="item.href"
          target="_blank"
          rel="noopener"
          class="text-sm font-medium text-slate-700"
          @click="open = false"
        >
          {{ item.label }}
        </a>
        <NuxtLink
          v-else
          :to="item.href"
          class="text-sm font-medium text-slate-700"
          @click="open = false"
        >
          {{ item.label }}
        </NuxtLink>
      </template>
    </nav>
  </header>
</template>

<script setup lang="ts">
const settings = await useSettings()
const nav = await useNav()
const open = ref(false)

const logoUrl = computed(() =>
  settings ? useFile(settings, 'logo') : null
)
</script>
