/**
 * Error handling composable for Vue.js calendar application.
 * Provides centralized error handling with logging and user feedback.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { CalendarError } from '@/types/errors'
import { isCalendarError } from '@/types/errors'

export interface ErrorHandlerOptions {
  /** Enable console logging for errors */
  enableLogging?: boolean
  /** Maximum number of errors to keep in history */
  maxHistorySize?: number
  /** Custom error handler function */
  onError?: (error: CalendarError) => void
}

export interface ErrorHandlerState {
  /** Current active error */
  currentError: CalendarError | null
  /** Error history */
  errorHistory: Array<{
    error: CalendarError
    timestamp: Date
    handled: boolean
  }>
  /** Error count by type */
  errorCounts: Record<string, number>
}

export interface ErrorHandlerReturn {
  // State
  currentError: Ref<CalendarError | null>
  hasError: ComputedRef<boolean>
  errorHistory: Ref<ErrorHandlerState['errorHistory']>
  errorCounts: Ref<ErrorHandlerState['errorCounts']>

  // Actions
  handleError: (error: unknown, context?: string) => void
  clearError: () => void
  clearHistory: () => void
  getErrorStats: () => ErrorHandlerState['errorCounts']

  // Utilities
  isCalendarError: typeof isCalendarError
  formatErrorForUser: (error: CalendarError) => string
  getRecentErrors: (count?: number) => ErrorHandlerState['errorHistory']
}

/**
 * Composable for handling errors in the calendar application.
 *
 * @param options - Configuration options for error handling
 * @returns Error handling utilities and state
 *
 * @example
 * ```typescript
 * const {
 *   currentError,
 *   hasError,
 *   handleError,
 *   clearError,
 *   formatErrorForUser
 * } = useErrorHandler({
 *   enableLogging: true,
 *   maxHistorySize: 50
 * })
 * ```
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandlerReturn {
  const { enableLogging = true, maxHistorySize = 100, onError } = options

  // Reactive state
  const currentError = ref<CalendarError | null>(null)
  const errorHistory = ref<ErrorHandlerState['errorHistory']>([])
  const errorCounts = ref<ErrorHandlerState['errorCounts']>({})

  // Computed properties
  const hasError = computed(() => currentError.value !== null)

  /**
   * Handle an error with proper logging and state management.
   */
  function handleError(error: unknown, context?: string): void {
    let calendarError: CalendarError | null = null

    // Check if it's already a calendar error
    if (isCalendarError(error)) {
      calendarError = error
    } else if (error instanceof Error) {
      // Wrap generic errors in CalendarDataError
      calendarError = new Error(`[Generic] ${error.message}`) as CalendarError
    } else {
      // Handle unknown error types
      calendarError = new Error(`[Unknown] ${String(error)}`) as CalendarError
    }

    // Set as current error
    currentError.value = calendarError

    // Add to history
    const errorEntry = {
      error: calendarError,
      timestamp: new Date(),
      handled: false,
      context,
    }

    errorHistory.value.unshift(errorEntry)

    // Trim history if it exceeds max size
    if (errorHistory.value.length > maxHistorySize) {
      errorHistory.value = errorHistory.value.slice(0, maxHistorySize)
    }

    // Update error counts
    const errorType = calendarError.constructor.name
    errorCounts.value[errorType] = (errorCounts.value[errorType] || 0) + 1

    // Log error if enabled
    if (enableLogging) {
      console.error(`[Calendar Error] ${context || 'No context'}:`, {
        error: calendarError,
        timestamp: errorEntry.timestamp,
        stack: calendarError.stack,
      })
    }

    // Call custom error handler
    if (onError) {
      try {
        onError(calendarError)
      } catch (handlerError) {
        console.error('[Error Handler] Custom error handler failed:', handlerError)
      }
    }
  }

  /**
   * Clear the current error.
   */
  function clearError(): void {
    currentError.value = null
  }

  /**
   * Clear the entire error history.
   */
  function clearHistory(): void {
    errorHistory.value = []
    errorCounts.value = {}
    clearError()
  }

  /**
   * Get error statistics.
   */
  function getErrorStats(): ErrorHandlerState['errorCounts'] {
    return { ...errorCounts.value }
  }

  /**
   * Format error message for user display.
   */
  function formatErrorForUser(error: CalendarError): string {
    // Remove technical prefixes and make user-friendly
    return (
      error.message.replace(/^\[(Calendar|Generic|Unknown)([^]]*)\]\s*/i, '').trim() ||
      'An unexpected error occurred'
    )
  }

  /**
   * Get recent errors from history.
   */
  function getRecentErrors(count: number = 10): ErrorHandlerState['errorHistory'] {
    return errorHistory.value.slice(0, count)
  }

  return {
    // State
    currentError,
    hasError,
    errorHistory,
    errorCounts,

    // Actions
    handleError,
    clearError,
    clearHistory,
    getErrorStats,

    // Utilities
    isCalendarError,
    formatErrorForUser,
    getRecentErrors,
  }
}

/**
 * Global error handler for unhandled promise rejections and errors.
 */
export function setupGlobalErrorHandler(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled promise rejection:', event.reason)
    // You could integrate with a logging service here
  })

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[Global] Uncaught error:', event.error)
    // You could integrate with a logging service here
  })
}
