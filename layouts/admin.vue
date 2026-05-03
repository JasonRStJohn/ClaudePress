<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex">

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="h-14 flex items-center px-5 border-b border-slate-200 shrink-0">
        <NuxtLink to="/" class="font-semibold text-slate-900 truncate hover:text-blue-700 transition-colors">{{ siteName }}</NuxtLink>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
          @click="sidebarOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="border-t border-slate-200 px-3 py-3 shrink-0">
        <div class="text-xs text-slate-400 px-3 mb-1 truncate">{{ currentUser?.email }}</div>
        <button
          class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors"
          @click="handleLogout"
        >
          Sign out
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/25 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile top bar -->
      <header class="h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-200 lg:hidden shrink-0">
        <button
          class="text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Open menu"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <NuxtLink to="/" class="font-medium text-slate-800 truncate hover:text-blue-700 transition-colors">{{ siteName }}</NuxtLink>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
const { currentUser, logout } = useAuth()
const config = useRuntimeConfig()
const siteName = config.public.siteName
const route = useRoute()

const sidebarOpen = ref(false)

const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Banners', to: '/admin/banners' },
  { label: 'Pages', to: '/admin/pages' },
  { label: 'Posts', to: '/admin/posts' },
  { label: 'Documents', to: '/admin/documents' },
  { label: 'Media', to: '/admin/media' },
]

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const handleLogout = () => {
  logout()
  navigateTo('/login')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
