<template>
  <div class="min-h-screen flex flex-col bg-white text-slate-800">
    <CpNav />
    <main class="flex-1">
      <slot />
    </main>
    <CpFooter />
  </div>
</template>
