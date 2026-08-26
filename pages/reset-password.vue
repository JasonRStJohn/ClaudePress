<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold text-slate-900">{{ siteName }}</h1>
        <p class="mt-1 text-slate-500 text-sm">Set a new password</p>
      </div>

      <div
        v-if="!token"
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-center space-y-4"
      >
        <p class="text-sm text-slate-700">
          This reset link is missing its token or has already been used.
        </p>
        <NuxtLink to="/forgot-password" class="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
          Request a new link
        </NuxtLink>
      </div>

      <div
        v-else-if="done"
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-center space-y-4"
      >
        <p class="text-sm text-green-700">Your password has been reset.</p>
        <NuxtLink to="/login" class="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </NuxtLink>
      </div>

      <form
        v-else
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="next">New password</label>
          <input
            id="next"
            v-model="next"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="loading"
            class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <p class="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="confirm">Confirm new password</label>
          <input
            id="confirm"
            v-model="confirm"
            type="password"
            autocomplete="new-password"
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
          {{ loading ? 'Saving…' : 'Reset password' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const { confirmPasswordReset } = useAuth()
const config = useRuntimeConfig()
const siteName = config.public.siteName

const route = useRoute()
const token = computed(() => (route.query.token as string) || '')

const next = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const done = ref(false)

const handleSubmit = async () => {
  error.value = ''

  if (next.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (next.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await confirmPasswordReset(token.value, next.value)
    done.value = true
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'This reset link is invalid or has expired. Request a new one.'
  } finally {
    loading.value = false
  }
}
</script>
