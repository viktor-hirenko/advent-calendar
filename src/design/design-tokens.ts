import type { CSSVarName } from './design-tokens.d'

/**
 * Helper function to set CSS custom properties safely.
 * @param el - HTML element to set the property on
 * @param name - CSS variable name (e.g., "--color-layer-1")
 * @param value - CSS variable value
 */
export const setCSSVar = (el: HTMLElement, name: CSSVarName, value: string): void => {
  el.style.setProperty(name, value)
}
