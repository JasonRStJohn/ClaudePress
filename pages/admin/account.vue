<template>
  <div class="max-w-md">
    <h1 class="text-xl font-semibold text-slate-900 mb-1">Account</h1>
    <p class="text-slate-500 text-sm mb-8">Signed in as {{ currentUser?.email }}.</p>

    <form
      class="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4"
      @submit.prevent="handleChange"
    >
      <h2 class="text-sm font-semibold text-slate-900">Change password</h2>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="current">Current password</label>
        <input
          id="current"
          v-model="current"
          type="password"
          autocomplete="current-password"
          required
          :disabled="loading"
          class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

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

      <div
        v-if="success"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2"
      >
        Password updated.
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Updating…' : 'Update password' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { currentUser, changePassword } = useAuth()

const current = ref('')
const next = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleChange = async () => {
  error.value = ''
  success.value = false

  if (next.value.length < 8) {
    error.value = 'New password must be at least 8 characters.'
    return
  }
  if (next.value !== confirm.value) {
    error.value = 'New passwords do not match.'
    return
  }

  loading.value = true
  try {
    await changePassword(current.value, next.value)
    success.value = true
    current.value = ''
    next.value = ''
    confirm.value = ''
  } catch (e: any) {
    error.value = e?.response?.message || e?.message || 'Could not update password. Check your current password.'
  } finally {
    loading.value = false
  }
}
</script>
