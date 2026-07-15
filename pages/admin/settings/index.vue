<template>
  <div class="max-w-3xl">
    <h1 class="text-xl font-semibold text-slate-900 mb-6">Settings</h1>

    <div v-if="loadError" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-6">
      {{ loadError }}
    </div>

    <form v-if="loaded" class="space-y-10" @submit.prevent="handleSubmit">

      <!-- General -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">General</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="site_name">Site name</label>
          <input
            id="site_name"
            v-model="form.site_name"
            type="text"
            required
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="tagline">Tagline</label>
          <input
            id="tagline"
            v-model="form.tagline"
            type="text"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <!-- Branding -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Branding</h2>
        <div>
          <img
            v-if="currentLogoUrl"
            :src="currentLogoUrl"
            alt="Current logo"
            class="h-16 w-auto rounded-md border border-slate-200 mb-2 object-contain bg-white"
          />
          <label class="block text-sm font-medium text-slate-700 mb-1" for="logo">
            {{ currentLogoUrl ? 'Replace logo (optional)' : 'Upload logo' }}
          </label>
          <input
            id="logo"
            ref="logoInput"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            :disabled="saving"
            class="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <div>
          <img
            v-if="currentFaviconUrl"
            :src="currentFaviconUrl"
            alt="Current favicon"
            class="h-8 w-auto rounded-md border border-slate-200 mb-2 object-contain bg-white"
          />
          <label class="block text-sm font-medium text-slate-700 mb-1" for="favicon">
            {{ currentFaviconUrl ? 'Replace favicon (optional)' : 'Upload favicon' }}
          </label>
          <input
            id="favicon"
            ref="faviconInput"
            type="file"
            accept="image/png,image/x-icon,image/svg+xml"
            :disabled="saving"
            class="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
      </div>

      <!-- Contact -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Contact</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="contact_email">Contact email</label>
            <input
              id="contact_email"
              v-model="form.contact_email"
              type="email"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="contact_phone">Contact phone</label>
            <input
              id="contact_phone"
              v-model="form.contact_phone"
              type="text"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="address">Address</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="3"
            :disabled="saving"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Social -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Social</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="facebook_url">Facebook URL</label>
            <input
              id="facebook_url"
              v-model="form.facebook_url"
              type="text"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="instagram_url">Instagram URL</label>
            <input
              id="instagram_url"
              v-model="form.instagram_url"
              type="text"
              :disabled="saving"
              class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Footer</h2>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Footer text</label>
          <CpRichEditor v-model="form.footer_text" placeholder="Footer content…" />
        </div>
      </div>

      <div v-if="saveError" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {{ saveError }}
      </div>
      <div v-if="saveSuccess" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        Settings saved.
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { pb } = useAuth()
const pbPublicUrl = usePbPublicUrl()

const loaded = ref(false)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')
const saveSuccess = ref(false)

const recordId = ref('')
const currentCollectionId = ref('')
const currentLogoFile = ref<string | null>(null)
const currentFaviconFile = ref<string | null>(null)

const logoInput = ref<HTMLInputElement | null>(null)
const faviconInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  site_name: '',
  tagline: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  footer_text: '',
})

const currentLogoUrl = computed(() => {
  if (!currentLogoFile.value || !currentCollectionId.value) return null
  return `${pbPublicUrl}/api/files/${currentCollectionId.value}/${recordId.value}/${currentLogoFile.value}`
})

const currentFaviconUrl = computed(() => {
  if (!currentFaviconFile.value || !currentCollectionId.value) return null
  return `${pbPublicUrl}/api/files/${currentCollectionId.value}/${recordId.value}/${currentFaviconFile.value}`
})

onMounted(async () => {
  const list = await pb.collection('settings').getList(1, 1).catch((e: any) => {
    loadError.value = e?.message || 'Settings not found.'
    return null
  })
  const record = list?.items?.[0]
  if (!record) {
    if (!loadError.value) loadError.value = 'Settings not found.'
    return
  }

  recordId.value = record.id
  currentCollectionId.value = record.collectionId
  form.site_name = record.site_name ?? ''
  form.tagline = record.tagline ?? ''
  form.contact_email = record.contact_email ?? ''
  form.contact_phone = record.contact_phone ?? ''
  form.address = record.address ?? ''
  form.footer_text = record.footer_text ?? ''

  const socials = record.socials ?? {}
  form.facebook_url = socials.facebook ?? ''
  form.instagram_url = socials.instagram ?? ''

  const logo = record.logo
  currentLogoFile.value = Array.isArray(logo) ? (logo[0] ?? null) : (logo ?? null)
  const favicon = record.favicon
  currentFaviconFile.value = Array.isArray(favicon) ? (favicon[0] ?? null) : (favicon ?? null)

  loaded.value = true
})

const handleSubmit = async () => {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const data = new FormData()
    data.append('site_name', form.site_name)
    data.append('tagline', form.tagline)
    data.append('contact_email', form.contact_email)
    data.append('contact_phone', form.contact_phone)
    data.append('address', form.address)
    data.append('footer_text', form.footer_text)
    data.append('socials', JSON.stringify({
      facebook: form.facebook_url,
      instagram: form.instagram_url,
    }))

    const logo = logoInput.value?.files?.[0]
    if (logo) data.append('logo', logo)
    const favicon = faviconInput.value?.files?.[0]
    if (favicon) data.append('favicon', favicon)

    const updated = await pb.collection('settings').update(recordId.value, data)

    const updatedLogo = updated.logo
    currentLogoFile.value = Array.isArray(updatedLogo) ? (updatedLogo[0] ?? null) : (updatedLogo ?? null)
    const updatedFavicon = updated.favicon
    currentFaviconFile.value = Array.isArray(updatedFavicon) ? (updatedFavicon[0] ?? null) : (updatedFavicon ?? null)
    if (logoInput.value) logoInput.value.value = ''
    if (faviconInput.value) faviconInput.value.value = ''

    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e?.response?.message || e?.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}
</script>
