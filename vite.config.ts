import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { resolveCampaign, type ResolvedCampaign } from './scripts/campaign.mjs'

const campaign = resolveCampaign()

const sharedBanner = fileURLToPath(new URL('./src/components/CalendarBanner.vue', import.meta.url))

/**
 * Fails early when the campaign theme is missing from the design tokens.
 */
function assertThemeExists(theme: string) {
  const tokensPath = fileURLToPath(new URL('./src/design/tokens.json', import.meta.url))
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as {
    themes?: Record<string, unknown>
  }
  const themes = Object.keys(tokens.themes ?? {})
  if (!themes.includes(theme)) {
    throw new Error(
      `Campaign theme "${theme}" is not defined in src/design/tokens.json (available: ${themes.join(', ')})`,
    )
  }
}

/**
 * Injects campaign theme and fonts stylesheet into index.html placeholders.
 */
function campaignHtml(current: ResolvedCampaign): Plugin {
  return {
    name: 'campaign-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replaceAll('__CAMPAIGN_THEME__', current.theme)
          .replaceAll('__CAMPAIGN_FONTS_URL__', current.fontsUrl),
    },
  }
}

assertThemeExists(campaign.theme)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), campaignHtml(campaign)],
  base: './', // relative paths in build for subfolder deployment
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Active campaign folder: config.json, images/, components/
      '@campaign': campaign.dir,
      // Campaign banner if present, otherwise the shared one
      '@campaign-banner': campaign.bannerPath ?? sharedBanner,
    },
  },
  build: {
    outDir: `dist/${campaign.id}`,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Global SCSS imports - available in all components
        additionalData: `@use "@/assets/scss/core" as *;`,
      },
    },
  },
})
