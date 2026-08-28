<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold text-slate-900">{{ siteName }}</h1>
        <p class="mt-1 text-slate-500 text-sm">Reset your password</p>
      </div>

      <div
        v-if="sent"
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4 text-center"
      >
        <p class="text-sm text-slate-700">
          If an account exists for <span class="font-medium">{{ email }}</span>,
          a password-reset link is on its way. Check your inbox and spam folder.
        </p>
        <NuxtLink to="/login" class="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium">
          Back to sign in
        </NuxtLink>
      </div>

      <form
        v-else
        class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4"
        @submit.prevent="handleSubmit"
      >
        <p class="text-sm text-slate-500">
          Enter your email and we'll send you a link to set a new password.
        </p>

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
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </button>

        <div class="text-center">
          <NuxtLink to="/login" class="text-sm text-slate-500 hover:text-slate-700">
            Back to sign in
          </NuxtLink>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const { requestPasswordReset } = useAuth()
const config = useRuntimeConfig()
const siteName = config.public.siteName

// Password reset is only offered where the site has enabled it (SMTP set up).
// Don't leave a reachable dead-end page when it's off.
if (!config.public.passwordResetEnabled) {
  await navigateTo('/login')
}

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  try {
    await requestPasswordReset(email.value)
    // Always report success — never reveal whether an account exists.
    sent.value = true
  } catch (e: any) {
    // Only surface genuine transport errors (network/SMTP down), not
    // "no such account", which PocketBase does not distinguish here anyway.
    error.value = e?.response?.message || e?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
