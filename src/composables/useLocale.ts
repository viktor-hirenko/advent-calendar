/**
 * Locale management composable.
 * Handles language detection and resolution with fallback chain.
 */

import { ref, type Ref } from 'vue'
import type { SupportedLanguage } from '@/types/app-config'

/**
 * Options for useLocale.
 */
export interface UseLocaleOptions {
  /** Languages the page can be shown in (the campaign's supportedLanguages). */
  supported: readonly SupportedLanguage[]
  /** Language used when no candidate is in the supported list (the campaign's defaultLanguage). */
  fallback: SupportedLanguage
  /** Optional ref with a preferred language. */
  userLanguageRef?: Ref<string | undefined>
}

/**
 * Return type for useLocale composable.
 */
export interface UseLocaleReturn {
  currentLanguage: Ref<SupportedLanguage>
  resolveLanguage: (userLanguage?: string) => SupportedLanguage
}

/**
 * Locale management composable with fallback chain.
 * Only languages from `supported` are accepted.
 * @param options - Supported languages, fallback language and optional preferred-language ref
 * @returns Locale management functions and state
 */
export function useLocale({
  supported,
  fallback,
  userLanguageRef,
}: UseLocaleOptions): UseLocaleReturn {
  const currentLanguage = ref<SupportedLanguage>(fallback)

  function resolveLanguage(userLanguage?: string): SupportedLanguage {
    // First check passed language
    if (userLanguage) {
      const candidate = userLanguage.split('-')[0] ?? ''
      if (isValidLanguage(candidate)) {
        return candidate
      }
    }

    // Then check language from ref
    if (userLanguageRef?.value) {
      const candidate = userLanguageRef.value.split('-')[0] ?? ''
      if (isValidLanguage(candidate)) {
        return candidate
      }
    }

    // Then check browser language
    const navLanguage = (navigator.language || 'en').split('-')[0] ?? ''
    if (isValidLanguage(navLanguage)) {
      return navLanguage
    }

    return fallback
  }

  /**
   * Validates if a language code is in the supported list.
   * @param lang - Language code to validate
   * @returns True if language is supported, false otherwise
   */
  function isValidLanguage(lang: string): lang is SupportedLanguage {
    return (supported as readonly string[]).includes(lang)
  }

  // Initialize language
  currentLanguage.value = resolveLanguage()

  return {
    currentLanguage,
    resolveLanguage,
  }
}
