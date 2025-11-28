import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    threads: false,
    include: ['src/tests/**/*.test.tsx', 'src/tests/**/*.test.ts']
  }
})
