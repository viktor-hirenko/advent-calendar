/**
 * Development-only logging utilities.
 * These functions only output to console when running in development mode.
 * In production builds, all calls are no-ops (no console output).
 */

/**
 * Logs a message to console only in development mode.
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function devLog(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(message, ...args)
  }
}

/**
 * Logs a warning to console only in development mode.
 * @param message - The warning message to log
 * @param args - Additional arguments to log
 */
export function devWarn(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(message, ...args)
  }
}

/**
 * Logs an error to console only in development mode.
 * @param message - The error message to log
 * @param args - Additional arguments to log
 */
export function devError(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(message, ...args)
  }
}

/**
 * Logs an info message to console only in development mode.
 * @param message - The info message to log
 * @param args - Additional arguments to log
 */
export function devInfo(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.info(message, ...args)
  }
}
