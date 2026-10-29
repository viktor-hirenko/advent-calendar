// Types for calendar functionality based on JSON structure

import type { Ref, ComputedRef } from 'vue'

// export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it' | 'es' | 'pt'
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it'

/**
 * Localized string map.
 * - `en` is required (canonical fallback).
 * - Other languages are optional (partial translations allowed).
 */
export type LocalizedText = { en: string } & Partial<
  Record<Exclude<SupportedLanguage, 'en'>, string>
>

/**
 * Time helpers bound to current time mode (local/utc).
 */
export interface TimeFns {
  ymd: (d: Date) => string
  parseYMD: (s: string) => Date
  isToday: (s: string) => boolean
  formatTaskDateByMode: (s: string, lang?: string) => string
  formatDisabledTaskDateByMode: (s: string, lang?: string) => string
  getTaskDateByMode: (i: number, start: string) => string
  getDaysBetweenByMode: (a: string, b: string) => number
}

/**
 * Single calendar task definition.
 */
export interface CalendarTask {
  id: string
  isActive?: boolean
  title: LocalizedText
  description: LocalizedText
  buttonText: LocalizedText
  timer?: LocalizedText
  image?: string
  targetUrl?: string
  /** Task mechanic (e.g. "bet", "deposit", "combo"); free-form, defined by the campaign. */
  type?: string
}

/** Alias kept for compatibility with existing components. */
export type TaskCard = CalendarTask

export interface NavigationItem {
  id: string
  label: string
  icon: string
  isActive?: boolean
}

/**
 * Content and assets shown by the calendar UI.
 */
export interface CalendarData {
  title: LocalizedText
  description: LocalizedText
  labels: {
    promotion: LocalizedText
  }
  disabledTask: DisabledTask
  tasks: CalendarTask[]
  termsButton: LocalizedText
  /**
   * Terms & Conditions modal content sourced from configuration.
   * - title: localized modal title
   * - html: localized HTML content with terms text
   */
  termsModal: {
    title: LocalizedText
    closeAriaLabel: LocalizedText
    html: LocalizedText
  }
  taskStatus: {
    finishesIn: LocalizedText
    finished: LocalizedText
    dayUnit?: LocalizedText
  }
  links?: {
    /** Global primary link; can be localized or plain string. */
    primary?: string | LocalizedText
  }
  images?: {
    banner?: {
      mobile?: string
      tablet?: string
      desktop?: string
      large?: string
      ultra?: string
      alt?: LocalizedText
    }
    decoration?: {
      ultra?: string
    }
    /** Global icon for disabled task state (resolved via resolveImg). */
    disabledTaskIcon?: string
  }
  /**
   * Illustrations per task type (tasks[].type), resolved via resolveImg.
   * - image: shown on the active card
   * - finishedImage: shown on finished cards (falls back to image)
   */
  taskTypes?: Record<string, TaskTypeImages>
}

/** Illustrations of one task type. */
export interface TaskTypeImages {
  image: string
  finishedImage?: string
}

/**
 * Runtime configuration that affects date math / layout.
 */
export interface CalendarConfig {
  enabled: boolean
  ui: {
    bannerSection: {
      visible: boolean
    }
    introSection: {
      visible: boolean
      title: boolean
      tagLabel: boolean
      description: boolean
    }
    calendarSection: {
      visible: boolean
      dayPicker: boolean
      tasksPanel: boolean
      /**
       * Button label on finished cards: the task's own label ("task", default)
       * or the disabled-card label that leads back to today's task ("returnToToday").
       */
      finishedCardButton?: 'task' | 'returnToToday'
    }
    footerSection: {
      visible: boolean
      termsButton: boolean
      termsModal: {
        visible: boolean
      }
    }
  }
  startDate: string
  endDate: string
  timeMode?: 'local' | 'utc'
  alignByWeekday?: boolean
  firstDayOfWeek?: 'auto' | 'monday' | 'sunday'
  /** Format card dates in the page language; when off, dates are always English ("Dec. 4"). */
  localizeDates?: boolean
  defaultLanguage: SupportedLanguage
  supportedLanguages: SupportedLanguage[]
}

export interface DisabledTask {
  title: LocalizedText
  buttonText: LocalizedText
  image?: string
}

/** Root JSON structure loaded from campaigns/<id>/config.json. */
export interface CalendarDataStructure {
  calendar: CalendarData
  config: CalendarConfig
}

/**
 * Single day cell in the calendar grid/timeline.
 */
export interface CalendarDay {
  id: number | string
  day: number
  date: string
  isActive: boolean
  isSelected: boolean
  isToday: boolean
  hasTask: boolean
  isPlaceholder?: boolean
  task?: CalendarTask
}

/** Optional query params supported by the app (debug/test). */
export interface QueryParams {
  language?: SupportedLanguage
  testDate?: string
  debug?: boolean
}

/**
 * Public surface returned by useAppConfig composable.
 */
export interface UseCalendarReturn {
  currentLanguage: Ref<SupportedLanguage>
  calendarData: Ref<CalendarData>
  config: Ref<CalendarConfig>
  calendarDays: Ref<CalendarDay[]>
  currentDate: Ref<Date>
  /** Current time; shifted to the ?testDate day when the parameter is set. */
  now: () => Date

  getLocalizedText: (text: LocalizedText, language?: SupportedLanguage) => string
  getTaskForDate: (date: string) => CalendarTask | undefined
  isTaskActive: (date: string) => boolean
  getTaskByIndex: (index: number) => CalendarTask
  isTaskActiveByIndex: (index: number) => boolean

  // Time-mode dependent helpers (thin wrappers around TimeFns)
  ymd: (d: Date) => string
  parseYMD: (s: string) => Date
  isToday: (s: string) => boolean
  formatTaskDate: (s: string) => string
  formatDisabledTaskDate: (s: string) => string
  getTaskDate: (i: number, start: string) => string
  getDaysBetween: (a: string, b: string) => number

  // Resolvers
  resolveTargetUrl: (task?: { targetUrl?: string }) => string | null
  resolveImg: (name?: string) => string

  // Full time helpers object (if needed by consumers)
  timeFns: ComputedRef<TimeFns>
}
