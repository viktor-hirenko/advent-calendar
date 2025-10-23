/* Auto-generated design token types - DO NOT EDIT */
/* Generated from src/design/tokens.json */

export type DesignTokenKey = "color-button-primary" | "color-button-secondary" | "color-button-tertiary" | "color-button-text-primary" | "color-button-text-secondary" | "color-button-text-tertiary" | "color-layer-1" | "color-layer-alt-1" | "color-notif-error" | "color-notif-successfully" | "color-tertiary-3" | "color-tertiary-4" | "color-tertiary-5" | "color-text-menu-active" | "color-text-menu-default" | "color-text-primary" | "color-text-secondary" | "gradient-button-primary" | "gradient-card" | "gradient-secondary";

export type CSSVarName = `--${DesignTokenKey}`;

/**
 * Helper function to set CSS custom properties safely
 * Note: Implement function in design-tokens.ts (runtime), not here.
 */
export declare const setCSSVar: (el: HTMLElement, name: CSSVarName, value: string) => void;
