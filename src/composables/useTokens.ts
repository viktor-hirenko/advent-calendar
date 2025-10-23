import type { DesignTokenKey, CSSVarName } from '../design/design-tokens.d'
import { setCSSVar } from '../design/design-tokens'

/**
 * Minimal composable for working with design tokens.
 * Returns CSS variables for use in inline styles.
 */
export function useTokens() {
  /**
   * Returns CSS variable for the specified token.
   * @param name - token name (e.g., "color-layer-1")
   * @returns CSS variable (e.g., "var(--color-layer-1)")
   */
  const var_ = (name: DesignTokenKey): string => {
    return `var(--${name})`
  }

  /**
   * Sets CSS variable in the root element.
   * Useful for dynamic theme changes.
   * @param name - token name
   * @param value - new value
   */
  const setToken = (name: DesignTokenKey, value: string): void => {
    const cssVarName = `--${name}` as CSSVarName
    setCSSVar(document.documentElement, cssVarName, value)
  }

  /**
   * Gets current value of CSS variable.
   * @param name - token name
   * @returns current variable value
   */
  const getToken = (name: DesignTokenKey): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
  }

  /**
   * Switches application theme.
   * @param theme - theme name (e.g., "dark")
   */
  const setTheme = (theme: string): void => {
    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * Gets current theme.
   * @returns current theme name or null
   */
  const getTheme = (): string | null => {
    return document.documentElement.getAttribute('data-theme')
  }

  return {
    var: var_,
    setToken,
    getToken,
    setTheme,
    getTheme,
  }
}
