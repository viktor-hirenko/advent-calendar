/**
 * Calendar date utilities (local time).
 * Rationale:
 * - Avoid UTC/ISO to prevent "off-by-one day" around midnight and DST.
 * - Parse YYYY-MM-DD using local constructor, never `new Date(str)`.
 * Invariants: all comparisons and formatting happen in local time.
 */

// Type augmentation for Intl.Locale to provide proper TypeScript support
interface ExtendedIntlLocale {
  weekInfo?: {
    firstDay: 0 | 1 // 0 = Sunday, 1 = Monday
  }
}

declare global {
  interface Intl {
    Locale: new (locale: string) => ExtendedIntlLocale
  }
}

/**
 * Returns YYYY-MM-DD in local time.
 * @param d - Date object to format
 * @returns Date string in YYYY-MM-DD format
 * @example ymdLocal(new Date(2025, 0, 2)) === "2025-01-02"
 */
export function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Parses YYYY-MM-DD string as local date.
 * @param s - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 * @throws Error if format is invalid
 * @example parseYMDLocal("2025-01-02") creates local date for Jan 2, 2025
 */
export function parseYMDLocal(s: string): Date {
  const parts = s.split('-').map(Number)

  // Check format validity
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date format: ${s}. Expected YYYY-MM-DD`)
  }

  const y = parts[0]!
  const m = parts[1]!
  const d = parts[2]!
  return new Date(y, m - 1, d)
}

/**
 * Calculates task date based on index and start date.
 * @param taskIndex - task index in array (starting from 0)
 * @param startDate - start date in YYYY-MM-DD format
 * @returns date in YYYY-MM-DD format
 * @example getTaskDate(5, "2025-01-01") === "2025-01-06"
 */
export function getTaskDate(taskIndex: number, startDate: string): string {
  const start = parseYMDLocal(startDate || '')
  const taskDate = new Date(start)
  taskDate.setDate(start.getDate() + taskIndex)
  return ymdLocal(taskDate)
}

/**
 * Counts number of days between two dates (inclusive).
 * @param startDate - start date in YYYY-MM-DD format
 * @param endDate - end date in YYYY-MM-DD format
 * @returns number of days
 * @example getDaysBetween("2025-01-01", "2025-01-03") === 3
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseYMDLocal(startDate)
  const end = parseYMDLocal(endDate)
  const timeDiff = end.getTime() - start.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both dates
  return daysDiff
}

/**
 * Determines month for display based on task index.
 * @param taskIndex - task index in array
 * @param startDate - start date in YYYY-MM-DD format
 * @returns month name in English
 * @example getTaskMonth(5, "2025-01-01") === "January"
 */
export function getTaskMonth(taskIndex: number, startDate: string): string {
  const date = parseYMDLocal(getTaskDate(taskIndex, startDate))
  return date.toLocaleDateString('en', { month: 'long' })
}

/**
 * Formats date to "Dec. 27" format.
 * @param dateString - date in YYYY-MM-DD format
 * @returns formatted date
 * @example formatTaskDate("2025-12-27") === "Dec. 27"
 */
export function formatTaskDate(dateString: string): string {
  const date = parseYMDLocal(dateString)
  const month = date.toLocaleDateString('en', { month: 'short' })
  const day = date.getDate()
  return `${month}. ${day}`
}

/**
 * Formats date to "December, 21" format for disabled cards.
 * @param dateString - date in YYYY-MM-DD format
 * @returns formatted date with full month name and comma
 * @example formatDisabledTaskDate("2025-12-21") === "December, 21"
 */
export function formatDisabledTaskDate(dateString: string): string {
  const date = parseYMDLocal(dateString)
  const month = date.toLocaleDateString('en', { month: 'long' })
  const day = date.getDate()
  return `${month}, ${day}`
}

/**
 * Checks if date is today (local time).
 * @param dateString - date in YYYY-MM-DD format
 * @returns true if date is today
 * @example isToday("2025-01-16") returns true if today is Jan 16, 2025
 */
export function isToday(dateString: string): boolean {
  return dateString === ymdLocal(new Date())
}

/**
 * Checks if date is in the past (local time).
 * @param dateString - date in YYYY-MM-DD format
 * @returns true if date is in the past
 * @example isPastDate("2025-01-15") returns true if today is Jan 16, 2025
 */
export function isPastDate(dateString: string): boolean {
  const a = parseYMDLocal(dateString)
  const b = parseYMDLocal(ymdLocal(new Date()))
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return a.getTime() < b.getTime()
}

/**
 * Checks if date is in the future (local time).
 * @param dateString - date in YYYY-MM-DD format
 * @returns true if date is in the future
 * @example isFutureDate("2025-01-17") returns true if today is Jan 16, 2025
 */
export function isFutureDate(dateString: string): boolean {
  const a = parseYMDLocal(dateString)
  const b = parseYMDLocal(ymdLocal(new Date()))
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return a.getTime() > b.getTime()
}

// === UTC utilities ==================

/**
 * Returns YYYY-MM-DD in UTC.
 * @param d - Date object
 * @returns Date string in YYYY-MM-DD (UTC)
 */
export function ymdUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Parses YYYY-MM-DD as a UTC date at 00:00:00Z.
 * Never use `new Date(str)` (timezone-ambiguous).
 * @param s - date string in YYYY-MM-DD format
 * @returns Date at 00:00:00Z
 * @throws Error if format is invalid
 */
export function parseYMDUTC(s: string): Date {
  const parts = s.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date format: ${s}. Expected YYYY-MM-DD`)
  }
  const [y, m, d] = parts
  return new Date(Date.UTC(y!, m! - 1, d!))
}

/**
 * Checks if date equals today's UTC date.
 * @param dateString - YYYY-MM-DD
 */
export function isTodayUTC(dateString: string): boolean {
  return dateString === ymdUTC(new Date())
}

/** Allowed time modes. */
export type TimeMode = 'local' | 'utc'

/**
 * Time facade (mode-aware).
 * Exposes ymd/parse/isToday/formatters/getTaskDate/getDaysBetween
 * without leaking the chosen time base to callers.
 */
export function makeTime(mode: TimeMode) {
  const isUTC = mode === 'utc'

  // Base blocks: replace implementations depending on mode
  const ymd = isUTC ? ymdUTC : ymdLocal
  const parseYMD = isUTC ? parseYMDUTC : parseYMDLocal
  const isTodayFn = isUTC ? isTodayUTC : isToday

  /**
   * Formats date to "Dec. 27" (mode-aware).
   */
  function formatTaskDateByMode(dateString: string): string {
    const date = parseYMD(dateString)
    // Short month name with fixed TZ
    const month = new Intl.DateTimeFormat('en', {
      month: 'short',
      ...(isUTC ? { timeZone: 'UTC' } : {}),
    }).format(date)
    const day = isUTC ? date.getUTCDate() : date.getDate()
    return `${month}. ${day}`
  }

  /**
   * Formats date to "December, 21" (mode-aware).
   */
  function formatDisabledTaskDateByMode(dateString: string): string {
    const date = parseYMD(dateString)
    const month = new Intl.DateTimeFormat('en', {
      month: 'long',
      ...(isUTC ? { timeZone: 'UTC' } : {}),
    }).format(date)
    const day = isUTC ? date.getUTCDate() : date.getDate()
    return `${month}, ${day}`
  }

  /**
   * Calculates task date based on index and start date (inclusive) in current mode.
   * @param taskIndex - index starting from 0
   * @param startDate - YYYY-MM-DD
   */
  function getTaskDateByMode(taskIndex: number, startDate: string): string {
    const start = parseYMD(startDate || '')
    // Increment on already normalized date of required mode
    const d = new Date(start)
    if (isUTC) {
      d.setUTCDate(start.getUTCDate() + taskIndex)
    } else {
      d.setDate(start.getDate() + taskIndex)
    }
    return ymd(d)
  }

  /**
   * Counts days between two dates inclusive (mode-aware).
   * @param startDate - YYYY-MM-DD
   * @param endDate - YYYY-MM-DD
   */
  function getDaysBetweenByMode(startDate: string, endDate: string): number {
    const start = parseYMD(startDate)
    const end = parseYMD(endDate)
    // Normalize to midnight of selected mode
    if (isUTC) {
      start.setUTCHours(0, 0, 0, 0)
      end.setUTCHours(0, 0, 0, 0)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
    }
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return {
    // basics
    ymd,
    parseYMD,
    isToday: isTodayFn,

    // formatting
    formatTaskDateByMode,
    formatDisabledTaskDateByMode,

    // calculations
    getTaskDateByMode,
    getDaysBetweenByMode,
  }
}

/**
 * Determines the first day of week (0=Sunday, 1=Monday) with fallback strategy.
 *
 * Priority order:
 * 1. Explicit config parameter (highest priority)
 * 2. Modern Intl.Locale.weekInfo API (Chrome 125+)
 * 3. Regional fallback based on common week start conventions
 *
 * Regional fallback logic:
 * - US, Canada, Philippines: Sunday start (common in North America)
 * - All other regions: Monday start (ISO 8601 standard)
 *
 * This fallback ensures the calendar works correctly across all locales,
 * even when Intl.Locale is unavailable or the browser doesn't support weekInfo.
 *
 * @param lang - Language code (e.g., 'en-US', 'fr-FR')
 * @param cfg - Explicit configuration override
 * @returns 0 for Sunday start, 1 for Monday start
 */
export function getFirstDayOfWeekFromLang(lang: string, cfg: 'auto' | 'monday' | 'sunday'): 0 | 1 {
  if (cfg === 'monday') return 1
  if (cfg === 'sunday') return 0

  try {
    const locale = new Intl.Locale(lang) as unknown as ExtendedIntlLocale
    const first = locale.weekInfo?.firstDay
    if (first === 0 || first === 1) return first
  } catch {
    // Silently degrade to fallback
  }

  const region = lang.split('-')[1]?.toUpperCase()
  return ['US', 'CA', 'PH'].includes(region ?? '') ? 0 : 1
}

/**
 * Strict YYYY-MM-DD parser that validates date existence.
 * Returns null if date doesn't exist (e.g., 2025-11-31).
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseYMDStrict(dateString: string): Date | null {
  const parts = dateString.split('-').map(Number)
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    return null
  }

  const [y, m, d] = parts
  if (!y || !m || !d) return null

  // Create date and check if it matches input
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }

  return date
}

/**
 * Clamps day to last day of month.
 * @param y - year
 * @param m - month (1-12)
 * @param d - day
 * @returns Clamped date components
 */
export function clampToMonthEnd(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const lastDay = new Date(y, m, 0).getDate() // Last day of month
  return { y, m, d: Math.min(d, lastDay) }
}

/**
 * Warns once per session to avoid spam.
 * @param key - Unique key for this warning
 * @param message - Warning message
 */
const warnedKeys = new Set<string>()
export function warnOnce(key: string, message: string): void {
  if (warnedKeys.has(key)) return
  warnedKeys.add(key)
  // Import dynamically to avoid circular dependency
  import('./devLog').then(({ devWarn }) => {
    devWarn(`[Calendar] ${message}`)
  })
}

/**
 * Builds a month grid with leading placeholders for proper weekday alignment.
 * Returns an array where the first N items may be placeholders (no date/click).
 * Use these placeholders to keep the real days aligned in a 7-column grid.
 */
export function buildMonthDays(
  year: number,
  monthIndex: number, // 0..11
  firstDayOfWeek: 0 | 1,
) {
  const out: Array<
    | { id: string; isPlaceholder: true; day: 0 }
    | { id: string; isPlaceholder: false; day: number; date: string }
  > = []

  const firstDate = new Date(year, monthIndex, 1)
  const weekday = firstDate.getDay() // 0..6 (0 = Sunday)
  const offset = (weekday - firstDayOfWeek + 7) % 7 // offset for month start

  // Placeholders at month start
  for (let i = 0; i < offset; i++) {
    out.push({ id: `ph-${year}-${monthIndex}-${i}`, isPlaceholder: true, day: 0 })
  }

  // Real days
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const y = String(year)
    const m = String(monthIndex + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    out.push({
      id: `${y}-${m}-${dd}`,
      isPlaceholder: false,
      day: d,
      date: `${y}-${m}-${dd}`,
    })
  }

  return out
}
