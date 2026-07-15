# Settings Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/admin/settings` page to the ClaudePress base layer so editors can manage the `settings` singleton (site name, tagline, logo, favicon, contact info, social links, footer text) without touching the raw PocketBase dashboard.

**Architecture:** One new Vue page, `pages/admin/settings/index.vue`, following the exact hardcoded-form conventions already used by `pages/admin/pages/[id].vue` and `pages/admin/posts/[id].vue` — reactive `form` object, manual `FormData` build for file fields, `pb.collection('settings')` calls via `useAuth()`. No new abstractions, no schema-driven rendering. A one-line nav entry in `layouts/admin.vue` makes it reachable.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, Tailwind CSS, PocketBase JS SDK (via `usePb`/`useAuth`), `CpRichEditor` (Tiptap wrapper already in the layer).

This repo (`ClaudePress`) has no test framework (`package.json` has no test script, no `*.test.*`/`*.spec.*` files anywhere). Verification throughout this plan is manual: run the stack with `docker compose up --build` from the ClaudePress root (its `compose.yml` is explicitly "for running ClaudePress standalone (smoke-test mode)"), then drive the page in a browser at `http://localhost:3000`.

## Global Constraints

- Follow existing admin-page conventions exactly: slate/blue Tailwind classes (`border-slate-300`, `focus:ring-blue-500`, `disabled:opacity-50`), same error-banner markup (`text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3`).
- No schema-driven/dynamic field rendering — every field is an explicit, named `<input>`/control (per the approved design spec, `docs/superpowers/specs/2026-07-15-settings-admin-page-design.md`).
- Base social platforms are exactly Facebook and Instagram — no others.
- No create-if-missing logic and no delete button for the settings record.
- Don't modify the `settings` collection schema or its rules — `updateRule` is already unlocked for authenticated users (`backend/pb_migrations/1710000001_auth_rules.js`).

---

### Task 1: Build the settings admin page

**Files:**
- Create: `pages/admin/settings/index.vue`

**Interfaces:**
- Consumes: `useAuth()` → `{ pb }` (existing composable, `composables/useAuth.ts`); `usePbPublicUrl()` (existing composable, `composables/usePb.ts`); `CpRichEditor` component (existing, auto-imported as `Cp/RichEditor.vue`); PocketBase `settings` collection fields: `site_name`, `tagline`, `logo`, `favicon`, `contact_email`, `contact_phone`, `address`, `socials` (json: `{ facebook, instagram }`), `footer_text`.
- Produces: route `/admin/settings`, consumed by Task 2's nav link.

- [ ] **Step 1: Write the page file**

```vue
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
```

- [ ] **Step 2: Start the ClaudePress standalone stack**

Run: `cd /home/jason/sites/ClaudePress && docker compose up --build -d`
Expected: `backend` (PocketBase, port 8090) and `frontend` (Nuxt, port 3000) containers running. Check with `docker compose ps` — both show `running`/`Up`.

- [ ] **Step 3: Ensure a `users` account exists to log in with**

Open `http://localhost:8090/_/` in a browser. If prompted to create the first superuser, do so. Then, in the PocketBase dashboard, go to Collections → `users` → New record, and create one record with an email/password (any values) so there's an account to authenticate with at the site's `/login` page. Skip this step if a `users` record already exists from prior testing.

- [ ] **Step 4: Manually verify the page end-to-end**

In a browser:
1. Go to `http://localhost:3000/login`, sign in with the `users` account from Step 3.
2. Navigate directly to `http://localhost:3000/admin/settings` (no nav link yet — that's Task 2).
3. Confirm the form loads with the seeded values from the base migration (`site_name` = "ClaudePress Site", `tagline` = "A new site built with ClaudePress", other fields empty).
4. Edit `site_name`, `tagline`, `contact_email`, `contact_phone`, `address`, `facebook_url`, `instagram_url`, and `footer_text` (type something into the rich editor). Upload a small PNG for `logo` and `favicon`.
5. Click Save. Expected: button shows "Saving…", then a green "Settings saved." banner appears, and the logo/favicon previews update to the newly uploaded images.
6. Reload the page (`F5`). Expected: every field — including the two social URLs and the uploaded logo/favicon — reloads with the values just saved (confirms the `socials` json round-trips and file fields persisted).
7. In the PocketBase dashboard (`http://localhost:8090/_/`), open the `settings` collection's single record and confirm `socials` is stored as `{"facebook":"...","instagram":"..."}`.

- [ ] **Step 5: Commit**

```bash
cd /home/jason/sites/ClaudePress
git add pages/admin/settings/index.vue
git commit -m "feat: add settings admin page"
```

---

### Task 2: Wire up navigation and docs

**Files:**
- Modify: `layouts/admin.vue:82-89` (the `navItems` array)
- Modify: `README.md` (Phase status section)

**Interfaces:**
- Consumes: route `/admin/settings` from Task 1.
- Produces: nothing consumed by later tasks — this is the final task.

- [ ] **Step 1: Add the nav link**

In `layouts/admin.vue`, the current array (line ~82) is:

```ts
const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Banners', to: '/admin/banners' },
  { label: 'Pages', to: '/admin/pages' },
  { label: 'Posts', to: '/admin/posts' },
  { label: 'Documents', to: '/admin/documents' },
  { label: 'Media', to: '/admin/media' },
]
```

Change it to:

```ts
const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Settings', to: '/admin/settings' },
  { label: 'Banners', to: '/admin/banners' },
  { label: 'Pages', to: '/admin/pages' },
  { label: 'Posts', to: '/admin/posts' },
  { label: 'Documents', to: '/admin/documents' },
  { label: 'Media', to: '/admin/media' },
]
```

- [ ] **Step 2: Update README Phase status**

In `README.md`, find:

```
- **Phase 2**: Custom auth, client login, minimal admin panel
```

Replace with:

```
- **Phase 2**: Custom auth, client login, minimal admin panel (settings
  admin page done — `/admin/settings`; sites needing settings fields beyond
  the base schema shadow this page into their own `pages/admin/settings/`,
  same as any other override)
```

- [ ] **Step 3: Manually verify the nav link**

With the stack from Task 1 still running (or restart via `docker compose up --build -d` if the frontend container needs to pick up the `layouts/admin.vue` change):
1. Go to `http://localhost:3000/admin`.
2. Confirm a "Settings" link appears in the left sidebar, directly under "Dashboard".
3. Click it. Expected: navigates to `/admin/settings` and the sidebar highlights "Settings" as active (matches the existing `isActive()` highlight behavior for other nav items).

- [ ] **Step 4: Commit**

```bash
cd /home/jason/sites/ClaudePress
git add layouts/admin.vue README.md
git commit -m "feat: link settings admin page from nav, update README"
```

---

## Self-Review Notes

- **Spec coverage:** Placement/routing → Task 1 Step 1 + route path. Data flow (singleton fetch, socials pack/unpack, no create-if-missing, no delete) → Task 1 `onMounted`/`handleSubmit`. Form layout (5 sections, exact fields) → Task 1 template. Nav link → Task 2 Step 1. Docs → Task 2 Step 2. All spec sections are covered.
- **Placeholder scan:** No TBD/TODO; every step has complete, runnable code or exact manual actions with expected outcomes.
- **Type consistency:** `form.facebook_url`/`form.instagram_url` names match between `onMounted` (unpack) and `handleSubmit` (repack) in Task 1. `recordId`, `currentCollectionId`, `currentLogoFile`, `currentFaviconFile` are used consistently across the same file/task — no cross-task signature mismatches since Task 2 only touches `navItems` and README.
