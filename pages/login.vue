<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold text-slate-900">{{ siteName }}</h1>
        <p class="mt-1 text-slate-500 text-sm">Sign in to manage content</p>
      </div>

      <form
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4"
        @submit.prevent="handleLogin"
      >
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="loading"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="loading"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div
          v-if="error"
          class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const { login, isAuthenticated } = useAuth()
const config = useRuntimeConfig()
const siteName = config.public.siteName

if (isAuthenticated.value) {
  await navigateTo('/admin')
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>
