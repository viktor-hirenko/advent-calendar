/**
 * Calendar configuration and data management.
 * - Loads JSON config
 * - Resolves image URLs (dev & build)
 * - Generates calendar days
 * - Maps tasks to days (cyclic if tasks \< days)
 * - Localizes strings
 */

import { ref, computed, watch, inject } from 'vue'
import appConfigData from '@/data/app-config.json'
import { useQueryParams } from './useQueryParams'
import { useLocale } from './useLocale'
import { devLog, devWarn } from '@/utils/devLog'
import { AppConfigKey } from '@/symbols/app-config'

let singletonInstance: UseCalendarReturn | null = null

/**
 * Assets registry (dev & build):
 * Vite scans all files under src/assets/images and builds a map of logical
 * paths to final URLs (hashed in production).
 *
 * Why eager + query:'?url' + import:'default':
 * - eager: so the map exists immediately (no dynamic import promise)
 * - query:'?url': to get ready-to-use public URLs (/src/... in dev, /assets/xxx in build)
 * - import:'default': specifies what to import from the module
 *
 * Keys will be normalized to be relative to "assets/images/" (e.g. "banners/default/foo.webp").
 */
const imageFiles = import.meta.glob('@/assets/images/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const IMG: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(imageFiles).map(([abs, url]) => [
      // normalize absolute file path to a short key under "assets/images/"
      abs.replace(/^.*\/assets\/images\//, ''),
      url,
    ]),
  ),
)

import {
  makeTime,
  ymdLocal,
  parseYMDLocal,
  isToday,
  getTaskDate as getTaskDateLocal,
  getDaysBetween,
} from '@/utils/dateUtils'

import type {
  CalendarDataStructure,
  CalendarData,
  CalendarConfig,
  CalendarDay,
  CalendarTask,
  LocalizedText,
  SupportedLanguage,
  UseCalendarReturn,
} from '@/types/app-config'

// Keep raw config strongly typed
const raw = appConfigData as CalendarDataStructure

// Guard to avoid validating multiple times in the same session
let validationPerformed = false

/* ---------- Localization helpers ---------- */

/**
 * Returns localized string; falls back to English if missing.
 */
function getLocalizedText(text: LocalizedText, language: SupportedLanguage = 'en'): string {
  return text[language] || text.en || ''
}

/* ---------- Data validation ---------- */

/**
 * Validates task count against date range with cyclic fallback.
 *
 * WHY cyclic tasks: When tasks are less than days, tasks repeat to ensure every day has content.
 * This provides better UX than empty days and maintains calendar engagement.
 * The cyclic pattern ensures users always have something to interact with.
 *
 * Logs helpful diagnostics to help developers align content with calendar duration.
 * - Warns about mismatch to help developers align content properly
 * - Throws error for zero tasks (fatal - calendar would be completely empty)
 *
 * @param calendar - Calendar data structure
 * @param config - Calendar configuration with date range
 */
function validateTasksAndDays(calendar: CalendarData, config: CalendarConfig): void {
  if (validationPerformed) return
  validationPerformed = true

  const actualTasks = calendar.tasks.length
  const expectedDays = getDaysBetween(config.startDate, config.endDate)

  if (actualTasks === 0) {
    throw new Error('No tasks found in calendar data')
  }

  if (actualTasks !== expectedDays) {
    devWarn(
      `⚠️ Calendar validation: expected ${expectedDays} tasks for ${expectedDays} days, found ${actualTasks}. ` +
        `Tasks will be repeated cyclically. Consider adding ${expectedDays - actualTasks} tasks or adjust the date range.`,
    )
  } else {
    devLog(`✅ Calendar validation: ${actualTasks} tasks for ${expectedDays} days (perfect match)`)
  }

  devLog(`Diagnostics: ${actualTasks} tasks, ${expectedDays} days in range`)
}

/* ---------- Calendar days generation ---------- */

/**
 * Builds an array of day objects for the configured date range.
 * - Flags "today"
 * - Interaction flags (isActive/isSelected) are defaulted here and updated later.
 */
function generateCalendarDays(calendar: CalendarData, config: CalendarConfig): CalendarDay[] {
  validateTasksAndDays(calendar, config)

  const days: CalendarDay[] = []
  const startDate = parseYMDLocal(config.startDate)
  const endDate = parseYMDLocal(config.endDate)

  const currentDay = new Date(startDate)
  let id = 1

  while (currentDay <= endDate) {
    const dateString = ymdLocal(currentDay)
    const dayNumber = currentDay.getDate()

    days.push({
      id: id++,
      day: dayNumber,
      date: dateString || '',
      isActive: false, // updated later based on time mode / task date
      isSelected: false,
      isToday: isToday(dateString || ''),
      hasTask: true, // each day will have a task (cyclic if needed)
    })

    currentDay.setDate(currentDay.getDate() + 1)
  }

  return days
}

/* ---------- Task mapping helpers ---------- */

/**
 * Returns a task for a given day index; wraps around if tasks \< days.
 */
function getTaskForDay(dayIndex: number, tasks: CalendarTask[]): CalendarTask {
  const taskIndex = dayIndex % tasks.length
  const task = tasks[taskIndex]
  if (!task) throw new Error(`Task not found for day index ${dayIndex}`)
  return task
}

/**
 * Checks "active" by day index relative to config.startDate (local mode helper).
 */
function isTaskActiveByIndex(dayIndex: number, config: CalendarConfig): boolean {
  const taskDate = getTaskDateLocal(dayIndex, config.startDate)
  return isToday(taskDate)
}

/**
 * Backward compatibility: get task by exact date (no wrap).
 */
function getTaskForDate(
  date: string,
  tasks: CalendarTask[],
  config: CalendarConfig,
): CalendarTask | undefined {
  const startDate = parseYMDLocal(config.startDate)
  const targetDate = parseYMDLocal(date)
  const dayIndex = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  if (dayIndex >= 0 && dayIndex < tasks.length) return tasks[dayIndex]
  return undefined
}

/* ---------- Main composable ---------- */

/**
 * Creates singleton instance of app config
 */
function instantiateAppConfig(): UseCalendarReturn {
  /**
   * Resolves an image "logical path" from JSON into a real URL usable in <img> or CSS.
   * Accepts:
   * - Absolute/CDN: "https://..." → returned as-is
   * - Leading slashes or full dev paths: "/src/assets/images/foo", "assets/images/foo" → normalized
   * - Our JSON values: "banners/default/..." → looked up in IMG map
   *
   * Why here?
   * - Image paths are part of the calendar config; keeping resolver co-located keeps concerns together.
   */
  const resolveImg = (name?: string): string => {
    if (!name) return ''
    if (/^(https?:)?\/\//.test(name)) return name // absolute/CDN

    const clean = name
      .replace(/^\/+/, '') // strip leading slashes
      .replace(/^src\/assets\/images\//, '')
      .replace(/^assets\/images\//, '')

    const url = IMG[clean]
    if (!url) {
      devWarn(`[resolveImg] Not found in IMG map: ${clean}`)
    }
    return url ?? ''
  }

  /**
   * Query parameters and locale configuration.
   */
  const queryParams = useQueryParams()
  const { currentLanguage, resolveLanguage } = useLocale()

  /**
   * Raw configuration as reactive computed properties.
   */
  const calendarData = computed<CalendarData>(() => raw.calendar)
  const config = computed<CalendarConfig>(() => raw.config)

  /**
   * Time helpers depend on config.timeMode ("local" | "utc").
   * makeTime returns a bundle with ymd/parseYMD/isToday/getTaskDate/formatters
   * wired to the chosen mode.
   */
  const timeFns = computed(() => makeTime((config.value.timeMode ?? 'local') as 'local' | 'utc'))

  /**
   * Language resolution: URL param has priority, fallback to locale detector.
   */
  if (queryParams.language) currentLanguage.value = queryParams.language
  else currentLanguage.value = resolveLanguage()

  /**
   * Optional test date for QA (e.g., freeze "today" via ?testDate=YYYY-MM-DD).
   */
  const currentDate = ref<Date>(new Date())
  if (queryParams.testDate) {
    currentDate.value = new Date(queryParams.testDate)
  } else {
    // Start a lightweight day ticker only when not in test mode
    let dayTicker: number | null = null

    const tick = () => {
      // Compare by YMD using time-mode aware helpers
      const prev = timeFns.value.ymd(currentDate.value)
      const now = new Date()
      const next = timeFns.value.ymd(now)
      if (next !== prev) currentDate.value = now
    }

    // tick every 30s is enough to catch midnight; cheap & safe
    dayTicker = window.setInterval(tick, 30_000)

    // ensure immediate correct value on timeMode change (local <-> utc)
    watch(
      () => config.value.timeMode,
      () => {
        // re-evaluate "today" right away
        const now = new Date()
        currentDate.value = now
      },
    )

    window.addEventListener('beforeunload', () => {
      if (dayTicker !== null) {
        clearInterval(dayTicker)
      }
    })
  }

  /**
   * Calendar days array with attached tasks.
   */
  const calendarDays = ref<CalendarDay[]>([])

  /**
   * Updates calendar days array with tasks and active states.
   * - Generates days for configured date range
   * - Attaches tasks cyclically if needed
   * - Sets active flags based on current date
   */
  function updateCalendarDays() {
    const days = generateCalendarDays(calendarData.value, config.value)
    const tasks = calendarData.value.tasks

    days.forEach((day, index) => {
      const task = getTaskForDay(index, tasks)
      const taskDate = timeFns.value.getTaskDateByMode(index, config.value.startDate)

      day.hasTask = true
      // "active" means "today is this task's date" considering selected time mode
      day.isActive = timeFns.value.isToday(taskDate)
      day.task = task
    })

    calendarDays.value = days
  }

  // Initial calendar days build
  updateCalendarDays()

  /**
   * Watcher for tasks changes (deep watch: texts/urls may change).
   */
  watch(
    () => calendarData.value.tasks,
    () => updateCalendarDays(),
    { deep: true },
  )

  watch(
    () => [currentDate.value, config.value.timeMode, config.value.startDate, config.value.endDate],
    () => updateCalendarDays(),
  )

  /* ---------- Public API ---------- */

  function getTaskForDateLocal(date: string): CalendarTask | undefined {
    return getTaskForDate(date, calendarData.value.tasks, config.value)
  }

  function isTaskActiveLocal(date: string): boolean {
    return isToday(date)
  }

  function getTaskByIndex(index: number): CalendarTask {
    return getTaskForDay(index, calendarData.value.tasks)
  }

  function isTaskActiveByIndexLocal(index: number): boolean {
    return isTaskActiveByIndex(index, config.value)
  }

  /**
   * Resolve link URL for a task:
   * - task.targetUrl wins
   * - fallback to calendar.links.primary (supports LocalizedText or string)
   */
  function resolveTargetUrl(task?: { targetUrl?: string }) {
    const links = calendarData.value.links
    const globalPrimary = links?.primary
      ? typeof links.primary === 'string'
        ? links.primary
        : getLocalizedText(links.primary as LocalizedText, currentLanguage.value)
      : undefined

    return task?.targetUrl ?? globalPrimary ?? null
  }

  const instance: UseCalendarReturn = {
    currentLanguage,
    calendarData,
    config,
    calendarDays,
    currentDate,

    getLocalizedText,
    getTaskForDate: getTaskForDateLocal,
    isTaskActive: isTaskActiveLocal,
    getTaskByIndex,
    isTaskActiveByIndex: isTaskActiveByIndexLocal,

    // Time-mode aware fns
    ymd: (d: Date) => timeFns.value.ymd(d),
    parseYMD: (s: string) => timeFns.value.parseYMD(s),
    isToday: (s: string) => timeFns.value.isToday(s),

    formatTaskDate: (s: string) => timeFns.value.formatTaskDateByMode(s),
    formatDisabledTaskDate: (s: string) => timeFns.value.formatDisabledTaskDateByMode(s),

    getTaskDate: (i: number, start: string) => timeFns.value.getTaskDateByMode(i, start),
    getDaysBetween: (a: string, b: string) => timeFns.value.getDaysBetweenByMode(a, b),

    resolveTargetUrl,
    resolveImg,

    // Expose the whole timeFns bundle if needed elsewhere
    timeFns,
  }

  return instance
}

/**
 * Creates (or returns existing) singleton instance of app config.
 */
export function createAppConfig(): UseCalendarReturn {
  if (!singletonInstance) {
    singletonInstance = instantiateAppConfig()
  }

  return singletonInstance
}

/**
 * Singleton composable - returns existing instance or creates new one.
 */
export function useAppConfig(): UseCalendarReturn {
  // Try to get existing instance from inject
  const existingInstance = inject(AppConfigKey, null)

  if (existingInstance) {
    return existingInstance
  }

  // Fallback: create singleton instance when used outside provider (tests, scripts)
  return createAppConfig()
}
