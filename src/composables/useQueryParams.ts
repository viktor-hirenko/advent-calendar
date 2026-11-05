/**
 * Query parameters parsing composable.
 * Extracts and validates URL query parameters for language, test date, and debug mode.
 */

import type { SupportedLanguage, QueryParams } from '@/types/app-config'

/**
 * Parses URL query parameters and returns validated values.
 * @param supported - Languages accepted from ?language (the campaign's supportedLanguages)
 * @returns Parsed and validated query parameters
 */
export function useQueryParams(supported: readonly SupportedLanguage[]): QueryParams {
  try {
    const fullURL = window.location.href || ''
    const qIndex = fullURL.indexOf('?')
    if (qIndex === -1) return {}

    const query = fullURL.slice(qIndex + 1)
    const params = parseQueryString(query)

    const language: SupportedLanguage | undefined = isValidLanguage(
      params.language || '',
      supported,
    )
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
 * Validates if a language code is in the supported list.
 * @param lang - Language code to validate
 * @param supported - Supported language codes
 * @returns True if language is supported, false otherwise
 */
function isValidLanguage(
  lang: string,
  supported: readonly SupportedLanguage[],
): lang is SupportedLanguage {
  return (supported as readonly string[]).includes(lang)
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
