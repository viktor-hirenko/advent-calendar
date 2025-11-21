/**
 * Query parameters parsing composable.
 * Extracts and validates URL query parameters for language, test date, and debug mode.
 */

import type { SupportedLanguage, QueryParams } from '@/types/app-config'

/**
 * Parses URL query parameters and returns validated values.
 * @returns Parsed and validated query parameters
 */
export function useQueryParams(): QueryParams {
  try {
    const fullURL = window.location.href || ''
    const qIndex = fullURL.indexOf('?')
    if (qIndex === -1) return {}

    const query = fullURL.slice(qIndex + 1)
    const params = parseQueryString(query)

    const language: SupportedLanguage | undefined = isValidLanguage(params.language || '')
      ? (params.language as SupportedLanguage)
      : undefined

    const testDate = params.testDate || undefined
    const debug = params.debug === 'true'

    return {
      language,
      testDate,
      debug,
    }
  } catch {
    return {}
  }
}

/**
 * Validates if a language code is supported.
 * @param lang - Language code to validate
 * @returns True if language is supported, false otherwise
 */
function isValidLanguage(lang: string): lang is SupportedLanguage {
  return ['en', 'de', 'fr', 'it', 'es', 'pt'].includes(lang)
}

/**
 * Parses query string into key-value pairs.
 * @param query - Query string to parse
 * @returns Object with parsed key-value pairs
 */
function parseQueryString(query: string): Record<string, string> {
  return query.split('&').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split('=')
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {})
}
