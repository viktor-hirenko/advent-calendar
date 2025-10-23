import type { InjectionKey } from 'vue'
import type { UseCalendarReturn } from '@/types/app-config'

export const AppConfigKey: InjectionKey<UseCalendarReturn> = Symbol('AppConfig')
