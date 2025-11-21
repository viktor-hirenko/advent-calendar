/**
 * Locale management composable.
 * Handles language detection and resolution with fallback chain.
 */

import { ref, type Ref } from 'vue'
import type { SupportedLanguage } from '@/types/app-config'

/**
 * Return type for useLocale composable.
 */
export interface UseLocaleReturn {
  currentLanguage: Ref<SupportedLanguage>
  resolveLanguage: (userLanguage?: string) => SupportedLanguage
}

/**
 * Locale management composable with fallback chain.
 * @param userLanguageRef - Optional ref for user language
 * @returns Locale management functions and state
 */
export function useLocale(userLanguageRef?: Ref<string | undefined>): UseLocaleReturn {
  const currentLanguage = ref<SupportedLanguage>('en')

  function resolveLanguage(userLanguage?: string): SupportedLanguage {
    // First check passed language
    if (userLanguage) {
      const candidate = userLanguage.split('-')[0] as SupportedLanguage
      if (isValidLanguage(candidate)) {
        return candidate
      }
    }

    // Then check language from ref
    if (userLanguageRef?.value) {
      const candidate = userLanguageRef.value.split('-')[0] as SupportedLanguage
      if (isValidLanguage(candidate)) {
        return candidate
      }
    }

    // Then check browser language
    const navLanguage = (navigator.language || 'en').split('-')[0] as SupportedLanguage
    if (isValidLanguage(navLanguage)) {
      return navLanguage
    }

    // Default to English
    return 'en'
  }

  /**
   * Validates if a language code is supported.
   * @param lang - Language code to validate
   * @returns True if language is supported, false otherwise
   */
  function isValidLanguage(lang: string): lang is SupportedLanguage {
    // return ['en', 'de', 'fr', 'it', 'es', 'pt'].includes(lang)
    return ['en', 'de', 'fr', 'it'].includes(lang)
  }

  // Initialize language
  currentLanguage.value = resolveLanguage()

  return {
    currentLanguage,
    resolveLanguage,
  }
}
