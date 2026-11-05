/**
 * Application entry point.
 * - Imports global styles and mounts the Vue app
 * - Dynamically updates \<html lang\>, \<title\>, and \<meta description\>
 *   based on the current language and app-config localization
 */

import '@/design/tokens.css'
import '@/assets/scss/main.scss'
import '@/assets/scss/layouts/carousel.scss'
import '@/assets/scss/layouts/appear.scss'
import '@campaign-styles'

import { createApp, watch } from 'vue'
import App from './App.vue'
import { createAppConfig } from '@/composables/useAppConfig'
import { AppConfigKey } from '@/symbols/app-config'
import { prepareAppearAnimation, runAppearAnimationWhenReady } from '@/utils/appearAnimation'
import type { SupportedLanguage } from '@/types/app-config'

const app = createApp(App)

// Create and provide singleton instance
const appConfigInstance = createAppConfig()
app.provide(AppConfigKey, appConfigInstance)

// The carousel layout is styled from <html data-layout>, so the teleported terms modal follows it too
if (appConfigInstance.config.value.ui.layout === 'carousel') {
  document.documentElement.dataset.layout = 'carousel'
}

const appear =
  appConfigInstance.config.value.ui.appearAnimation === true && prepareAppearAnimation()

app.mount('#app')

if (appear) runAppearAnimationWhenReady()

// --- Localized document metadata setup ---
const { calendarData, currentLanguage, getLocalizedText, config } = appConfigInstance

/**
 * Ensures language is within supported set; falls back to default or 'en'
 */
const pickLang = (lang?: string): SupportedLanguage => {
  const supported = config.value.supportedLanguages
  const fallback = config.value.defaultLanguage || 'en'
  return supported.includes(lang as SupportedLanguage) ? (lang as SupportedLanguage) : fallback
}

/**
 * Updates global document metadata according to language
 * (html lang, dir, <title>, and <meta name="description">)
 */
const applyHead = (lang: SupportedLanguage) => {
  document.documentElement.lang = lang
  document.documentElement.dir = 'ltr'

  const title = getLocalizedText(calendarData.value.title, lang)
  const desc = getLocalizedText(calendarData.value.description, lang)

  if (title) document.title = title

  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }
  if (desc) meta.content = desc
}

// Initial metadata sync
applyHead(pickLang(currentLanguage.value))

// Re-apply when language changes
watch(currentLanguage, (lang) => {
  applyHead(pickLang(lang))
})
