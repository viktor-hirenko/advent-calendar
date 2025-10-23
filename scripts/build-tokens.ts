#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface DesignTokens {
  [key: string]: unknown
}
interface ThemeTokens {
  [theme: string]: DesignTokens
}
interface TokensConfig {
  version?: string
  themes?: ThemeTokens
  meta?: {
    source?: string
    notes?: string[]
    runtime?: {
      categories?: string[] // e.g. ["color","gradient"]
      allow?: string[] // dot-path in kebab-case, e.g. "color.button.primary", "color.text"
      deny?: string[] // dot-path in kebab-case
    }
    [k: string]: unknown
  }
  [key: string]: unknown
}

// ----------------------------
//  Utils
// ----------------------------
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function toKebab(s: string) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^\w-]+/g, '-')
    .replace(/_{1,}/g, '-')
    .replace(/-{2,}/g, '-')
    .toLowerCase()
}

// Convert dot-path to kebab-case for matching with allow/deny
function toKebabPath(parts: string[]) {
  return parts.map(toKebab).join('.')
}

type IncludeFn = (kebabDotPath: string, pathParts: string[]) => boolean

function flattenTokensFiltered(
  obj: unknown,
  shouldInclude: IncludeFn,
  path: string[] = [],
  out: Record<string, string> = {},
) {
  if (!isPlainObject(obj)) return
  Object.entries(obj).forEach(([k, v]) => {
    if (typeof k === 'string' && k.startsWith('_comment')) return
    const next = [...path, String(k)]
    if (isPlainObject(v)) {
      flattenTokensFiltered(v, shouldInclude, next, out)
    } else {
      if (v === null || v === undefined) return
      const str = String(v).trim()
      if (!str) return
      const kebabDot = toKebabPath(next)
      if (!shouldInclude(kebabDot, next)) return
      const cssVar = `--${next.map(toKebab).join('-')}`
      out[cssVar] = str
    }
  })
  return out
}

function makeIncludeFn(
  metaRuntime?: TokensConfig['meta'] extends infer M
    ? M extends { runtime?: unknown }
      ? M['runtime']
      : never
    : never,
): IncludeFn {
  const categories =
    metaRuntime?.categories && metaRuntime.categories.length
      ? metaRuntime.categories.map(toKebab)
      : ['color', 'gradient'] // default as before

  const allowList = (metaRuntime?.allow ?? []).map((s) => s.trim().toLowerCase())
  const denyList = (metaRuntime?.deny ?? []).map((s) => s.trim().toLowerCase())

  // Prefix matching: "color.text" matches "color.text.primary"
  const matchesPrefix = (list: string[], kebabDotPath: string) =>
    list.some((prefix) => kebabDotPath === prefix || kebabDotPath.startsWith(prefix + '.'))

  return (kebabDotPath: string, pathParts: string[]) => {
    // deny has priority
    if (matchesPrefix(denyList, kebabDotPath)) return false

    if (allowList.length > 0) {
      // Explicit allow
      return matchesPrefix(allowList, kebabDotPath)
    }

    // Otherwise - by root categories
    const root = toKebab(pathParts[0] ?? '')
    return categories.includes(root)
  }
}

// ----------------------------
//  Build pipeline
// ----------------------------
async function buildTokens() {
  console.log('🎨 Building design tokens...')

  const tokensPath = join(process.cwd(), 'src/design/tokens.json')
  const config: TokensConfig = JSON.parse(readFileSync(tokensPath, 'utf-8'))

  const designDir = join(process.cwd(), 'src/design')
  try {
    mkdirSync(designDir, { recursive: true })
  } catch {}

  const { themes = {}, meta, ...baseTokens } = config
  const runtimeCfg = meta?.runtime

  generateCSS(baseTokens as DesignTokens, themes, runtimeCfg)
  generateTypes(baseTokens as DesignTokens, themes, runtimeCfg)

  console.log('✅ Design tokens built successfully!')
}

function generateCSS(
  tokens: DesignTokens,
  themes?: ThemeTokens,
  runtimeCfg?: TokensConfig['meta']['runtime'],
) {
  const cssPath = join(process.cwd(), 'src/design/tokens.css')
  const shouldInclude = makeIncludeFn(runtimeCfg)

  let css = `/* Auto-generated design tokens - DO NOT EDIT */
/* Generated from src/design/tokens.json */
`

  // First collect base variables (if any)
  const rootVars: string[] = []
  Object.entries(tokens).forEach(([category, categoryTokens]) => {
    const flattened = flattenTokensFiltered({ [category]: categoryTokens }, shouldInclude) || {}
    Object.entries(flattened).forEach(([name, value]) => {
      rootVars.push(`  ${name}: ${value};`)
    })
  })

  // Print :root only if there is at least one variable
  if (rootVars.length) {
    css += `
:root {
${rootVars.join('\n')}
}
`
  }

  // Themes
  if (themes) {
    Object.entries(themes).forEach(([themeName, themeTokens]) => {
      const themeVars: string[] = []
      Object.entries(themeTokens).forEach(([category, categoryTokens]) => {
        const flattened = flattenTokensFiltered({ [category]: categoryTokens }, shouldInclude) || {}
        Object.entries(flattened).forEach(([name, value]) => {
          themeVars.push(`  ${name}: ${value};`)
        })
      })
      // Print theme even if empty (usually not empty)
      css += `
/* ${themeName} theme */
[data-theme="${themeName}"] {
${themeVars.join('\n')}
}
`
    })
  }

  css += `
/* Theme-specific overrides */
/* Add custom theme overrides here if needed */
`

  writeFileSync(cssPath, css)
  console.log('📄 Generated src/design/tokens.css')
}

function collectDesignTokenKeys(
  tokens: DesignTokens,
  themes?: ThemeTokens,
  runtimeCfg?: TokensConfig['meta']['runtime'],
) {
  const shouldInclude = makeIncludeFn(runtimeCfg)
  const keys: string[] = []

  const walk = (obj: unknown, path: string[] = []) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof k === 'string' && k.startsWith('_comment')) return
      const next = [...path, String(k)]
      if (isPlainObject(v)) return walk(v, next)
      if (v === null || v === undefined || String(v).trim() === '') return
      const kebabDot = toKebabPath(next)
      if (!shouldInclude(kebabDot, next)) return
      keys.push(next.map(toKebab).join('-'))
    })
  }

  // Process base tokens
  Object.entries(tokens).forEach(([category, categoryTokens]) => {
    walk({ [category]: categoryTokens })
  })

  // Process theme tokens
  if (themes) {
    Object.values(themes).forEach((themeTokens) => {
      Object.entries(themeTokens).forEach(([category, categoryTokens]) => {
        walk({ [category]: categoryTokens })
      })
    })
  }

  // Remove duplicates and sort
  return Array.from(new Set(keys)).sort()
}

function generateTypes(
  tokens: DesignTokens,
  themes?: ThemeTokens,
  runtimeCfg?: TokensConfig['meta']['runtime'],
) {
  const typesPath = join(process.cwd(), 'src/design/design-tokens.d.ts')
  const tokenKeys = collectDesignTokenKeys(tokens, themes, runtimeCfg)

  const typesContent = `/* Auto-generated design token types - DO NOT EDIT */
/* Generated from src/design/tokens.json */

export type DesignTokenKey = ${tokenKeys.length ? tokenKeys.map((k) => `"${k}"`).join(' | ') : 'never'};

export type CSSVarName = \`--\${DesignTokenKey}\`;

/**
 * Helper function to set CSS custom properties safely
 * Note: Implement function in design-tokens.ts (runtime), not here.
 */
export declare const setCSSVar: (el: HTMLElement, name: CSSVarName, value: string) => void;
`

  writeFileSync(typesPath, typesContent)
  console.log('📝 Generated src/design/design-tokens.d.ts')
}

// ----------------------------
buildTokens().catch((e) => {
  console.error('❌ buildTokens failed:', e?.message ?? e)
  process.exit(1)
})

export { buildTokens }
