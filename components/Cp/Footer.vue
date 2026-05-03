<template>
  <footer class="border-t border-slate-200 bg-slate-50 mt-16">
    <div class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-slate-600">
      <div>
        <div class="font-serif text-lg font-bold text-brand-800 mb-2">
          {{ settings?.site_name || 'ClaudePress' }}
        </div>
        <p v-if="settings?.tagline" class="text-slate-500">{{ settings.tagline }}</p>
        <div v-if="settings?.footer_text" class="mt-3 prose prose-sm" v-html="settings.footer_text" />
      </div>

      <div>
        <div class="font-semibold text-slate-700 mb-2">Navigate</div>
        <ul class="space-y-1">
          <li v-for="item in nav" :key="item.id">
            <NuxtLink :to="item.href" class="hover:text-brand-600">{{ item.label }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <div class="font-semibold text-slate-700 mb-2">Contact</div>
        <ul class="space-y-1">
          <li v-if="settings?.contact_email">
            <a :href="`mailto:${settings.contact_email}`" class="hover:text-brand-600">
              {{ settings.contact_email }}
            </a>
          </li>
          <li v-if="settings?.contact_phone">{{ settings.contact_phone }}</li>
          <li v-if="settings?.address" class="whitespace-pre-line">{{ settings.address }}</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      &copy; {{ year }} {{ settings?.site_name || 'ClaudePress' }}
    </div>
  </footer>
</template>

<script setup lang="ts">
const settings = await useSettings()
const nav = await useNav()
const year = new Date().getFullYear()
</script>
