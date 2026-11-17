import { defineConfig } from '@playwright/test'

const localUrl = 'http://127.0.0.1:4173/external-lookup/'
const liveUrl = process.env.LOOKUP_URL

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: liveUrl ?? localUrl,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  webServer: liveUrl ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: localUrl,
    reuseExistingServer: !process.env.CI,
  },
})
