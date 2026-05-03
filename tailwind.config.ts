import type { Config } from 'tailwindcss'

// Base ClaudePress theme. Sites can extend or override by providing their own
// tailwind.config.ts — Nuxt's Tailwind module merges configs across layers.
export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f7fa',
          100: '#e4ebf3',
          200: '#c5d3e3',
          300: '#9cb3cd',
          400: '#6d8cb0',
          500: '#4c6d95',
          600: '#3b567a',
          700: '#314663',
          800: '#2a3b52',
          900: '#1e2a3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
      },
    },
  },
}
