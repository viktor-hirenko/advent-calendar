/**
 * Enhanced error types for calendar operations.
 * Provides specific error classes with contextual information.
 */

/**
 * Error thrown when calendar date operations fail.
 */
export class CalendarDateError extends Error {
  constructor(
    message: string,
    public readonly invalidDate: string,
    public readonly operation: 'parse' | 'format' | 'calculate' | 'validate'
  ) {
    super(`[Calendar Date] ${message}`)
    this.name = 'CalendarDateError'
  }
}

/**
 * Error thrown when calendar configuration is invalid.
 */
export class CalendarConfigError extends Error {
  constructor(
    message: string,
    public readonly configPath: string,
    public readonly invalidValue: unknown
  ) {
    super(`[Calendar Config] ${message}`)
    this.name = 'CalendarConfigError'
  }
}

/**
 * Error thrown when calendar data validation fails.
 */
export class CalendarDataError extends Error {
  constructor(
    message: string,
    public readonly dataPath: string,
    public readonly expectedType: string,
    public readonly receivedValue: unknown
  ) {
    super(`[Calendar Data] ${message}`)
    this.name = 'CalendarDataError'
  }
}

/**
 * Error thrown when calendar rendering fails.
 */
export class CalendarRenderError extends Error {
  constructor(
    message: string,
    public readonly component: string,
    public readonly renderContext: Record<string, unknown>
  ) {
    super(`[Calendar Render] ${message}`)
    this.name = 'CalendarRenderError'
  }
}

/**
 * Type guard for CalendarDateError.
 * @param error - Unknown error to check
 * @returns True if error is a CalendarDateError
 */
export function isCalendarDateError(error: unknown): error is CalendarDateError {
  return error instanceof Error && error.name === 'CalendarDateError'
}

/**
 * Type guard for CalendarConfigError.
 * @param error - Unknown error to check
 * @returns True if error is a CalendarConfigError
 */
export function isCalendarConfigError(error: unknown): error is CalendarConfigError {
  return error instanceof Error && error.name === 'CalendarConfigError'
}

/**
 * Type guard for CalendarDataError.
 * @param error - Unknown error to check
 * @returns True if error is a CalendarDataError
 */
export function isCalendarDataError(error: unknown): error is CalendarDataError {
  return error instanceof Error && error.name === 'CalendarDataError'
}

/**
 * Type guard for CalendarRenderError.
 * @param error - Unknown error to check
 * @returns True if error is a CalendarRenderError
 */
export function isCalendarRenderError(error: unknown): error is CalendarRenderError {
  return error instanceof Error && error.name === 'CalendarRenderError'
}

/**
 * Union type of all calendar errors.
 */
export type CalendarError =
  | CalendarDateError
  | CalendarConfigError
  | CalendarDataError
  | CalendarRenderError

/**
 * Type guard for any calendar error.
 * @param error - Unknown error to check
 * @returns True if error is any type of CalendarError
 */
export function isCalendarError(error: unknown): error is CalendarError {
  return (
    isCalendarDateError(error) ||
    isCalendarConfigError(error) ||
    isCalendarDataError(error) ||
    isCalendarRenderError(error)
  )
}