/**
 * Types for design system from Figma.
 * Defines the visual design tokens used throughout the application.
 */
export interface DesignTokens {
  /** Color palette definitions */
  colors: {
    primary: string
    secondary: string
    tertiary: string
    background: string
    backgroundAlt: string
    textPrimary: string
    textSecondary: string
    textAlt: string
    textLink: string
    buttonPrimary: string
    buttonSecondary: string
    buttonTertiary: string
    success: string
    white: string
  }
  /** Font family definitions */
  fonts: {
    rubik: {
      regular: string
      bold: string
    }
    robotoSlab: {
      black: string
    }
  }
  /** Gradient definitions */
  gradients: {
    buttonPrimary: string
    buttonSecondary: string
  }
}

// These types are now imported from calendar.ts
export type { CalendarDay, TaskCard, NavigationItem } from './app-config'
