/**
 * Runtime type validation schemas using Zod.
 * Provides validation for external data and configuration.
 */

import { z, ZodError } from 'zod'

/**
 * Schema for supported languages.
 */
// export const SupportedLanguageSchema = z.enum(['en', 'de', 'fr', 'it', 'es', 'pt'])
export const SupportedLanguageSchema = z.enum(['en', 'de', 'fr', 'it'])

/**
 * Schema for localized text.
 */
export const LocalizedTextSchema = z
  .object({
    en: z.string().min(1, 'English text is required'),
  })
  .passthrough() // Allow other language properties

/**
 * Schema for calendar task.
 */
export const CalendarTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  isActive: z.boolean().optional(),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  buttonText: LocalizedTextSchema,
  timer: LocalizedTextSchema.optional(),
  image: z.string().url().optional(),
  targetUrl: z.string().url().optional(),
})

/**
 * Schema for disabled task.
 */
export const DisabledTaskSchema = z.object({
  title: LocalizedTextSchema,
  buttonText: LocalizedTextSchema,
  image: z.string().url().optional(),
})

/**
 * Schema for calendar links.
 */
export const CalendarLinksSchema = z
  .object({
    primary: z.union([z.string().url(), LocalizedTextSchema]).optional(),
  })
  .optional()

/**
 * Schema for calendar images.
 */
export const CalendarImagesSchema = z
  .object({
    banner: z
      .object({
        mobile: z.string().url().optional(),
        tablet: z.string().url().optional(),
        desktop: z.string().url().optional(),
        large: z.string().url().optional(),
        ultra: z.string().url().optional(),
      })
      .optional(),
    decoration: z
      .object({
        ultra: z.string().url().optional(),
      })
      .optional(),
    disabledTaskIcon: z.string().optional(),
  })
  .optional()

/**
 * Schema for task status.
 */
export const TaskStatusSchema = z.object({
  finishesIn: LocalizedTextSchema,
  finished: LocalizedTextSchema,
})

/**
 * Schema for calendar data.
 */
export const CalendarDataSchema = z.object({
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  labels: z.object({
    promotion: LocalizedTextSchema,
  }),
  disabledTask: DisabledTaskSchema,
  tasks: z.array(CalendarTaskSchema).min(1, 'At least one task is required'),
  termsButton: LocalizedTextSchema,
  taskStatus: TaskStatusSchema,
  links: CalendarLinksSchema,
  images: CalendarImagesSchema,
})

/**
 * Schema for calendar configuration.
 */
export const CalendarConfigSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
    timeMode: z.enum(['local', 'utc']).optional(),
    alignByWeekday: z.boolean().optional(),
    defaultLanguage: SupportedLanguageSchema,
    supportedLanguages: z
      .array(SupportedLanguageSchema)
      .min(1, 'At least one supported language is required'),
  })
  .refine((config) => new Date(config.startDate) <= new Date(config.endDate), {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  })

/**
 * Schema for the complete calendar configuration structure.
 */
export const CalendarDataStructureSchema = z.object({
  calendar: CalendarDataSchema,
  config: CalendarConfigSchema,
})

/**
 * Schema for query parameters.
 */
export const QueryParamsSchema = z
  .object({
    language: SupportedLanguageSchema.optional(),
    testDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
      .optional(),
    debug: z.boolean().optional(),
  })
  .partial()

/**
 * Runtime validation function with proper error handling.
 */
export function validateCalendarData(data: unknown): z.infer<typeof CalendarDataStructureSchema> {
  try {
    return CalendarDataStructureSchema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
      throw new Error(`Calendar data validation failed: ${formattedErrors}`)
    }
    throw error
  }
}

/**
 * Runtime validation for query parameters.
 */
export function validateQueryParams(params: unknown): z.infer<typeof QueryParamsSchema> {
  try {
    return QueryParamsSchema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
      throw new Error(`Query parameters validation failed: ${formattedErrors}`)
    }
    throw error
  }
}

/**
 * Type inference helpers.
 */
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>
export type LocalizedText = z.infer<typeof LocalizedTextSchema>
export type CalendarTask = z.infer<typeof CalendarTaskSchema>
export type DisabledTask = z.infer<typeof DisabledTaskSchema>
export type CalendarData = z.infer<typeof CalendarDataSchema>
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>
export type CalendarDataStructure = z.infer<typeof CalendarDataStructureSchema>
export type QueryParams = z.infer<typeof QueryParamsSchema>
