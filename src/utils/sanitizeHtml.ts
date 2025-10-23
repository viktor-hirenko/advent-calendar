/**
 * HTML sanitization utilities.
 * Provides safe HTML rendering for translations with limited tag support.
 */

import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML for safe rendering of translations.
 * Allows only <strong> tags for text emphasis.
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Checks if string contains HTML tags.
 * @param text - Text to check
 * @returns True if HTML tags are found
 */
export function containsHtml(text: string): boolean {
  return /<[^>]*>/g.test(text)
}
