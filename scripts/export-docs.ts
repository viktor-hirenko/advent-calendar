#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface DesignTokens {
  [category: string]: {
    [token: string]: string
  }
}

interface ThemeTokens {
  [theme: string]: DesignTokens
}

interface TokensConfig {
  themes?: ThemeTokens
  [category: string]: unknown
}

/**
 * Generate Markdown documentation for design tokens
 */
async function exportDocs() {
  console.log('📚 Generating design tokens documentation...')

  // Read tokens
  const tokensPath = join(process.cwd(), 'src/design/tokens.json')
  const config: TokensConfig = JSON.parse(readFileSync(tokensPath, 'utf-8'))

  // Extract base tokens (without themes)
  const { themes, ...baseTokens } = config
  const tokens: DesignTokens = baseTokens

  let markdown = `# Design Tokens Documentation

> Auto-generated from \`src/design/tokens.json\`

## Overview

This document contains all design tokens used in the Advent Calendar Vue application. Tokens are automatically generated from JSON configuration and available as CSS custom properties.

## Base Tokens

`

  // Generate documentation for each category
  Object.entries(tokens).forEach(([category, categoryTokens]) => {
    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
    markdown += `| Token | Value | CSS Variable |\n`
    markdown += `|-------|-------|-------------|\n`

    Object.entries(categoryTokens).forEach(([token, value]) => {
      // Skip comment tokens
      if (token.startsWith('_comment')) {
        return
      }

      const cssVar = `--${category}-${token}`
      markdown += `| \`${token}\` | \`${value}\` | \`${cssVar}\` |\n`
    })

    markdown += `\n`
  })

  // Generate themes documentation if they exist
  if (themes) {
    markdown += `## Themes\n\n`

    Object.entries(themes).forEach(([themeName, themeTokens]) => {
      markdown += `### ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme\n\n`
      markdown += `Use with \`data-theme="${themeName}"\` attribute.\n\n`

      Object.entries(themeTokens).forEach(([category, categoryTokens]) => {
        markdown += `#### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
        markdown += `| Token | Value | CSS Variable |\n`
        markdown += `|-------|-------|-------------|\n`

        Object.entries(categoryTokens).forEach(([token, value]) => {
          if (token.startsWith('_comment')) {
            return
          }

          const cssVar = `--${category}-${token}`
          markdown += `| \`${token}\` | \`${value}\` | \`${cssVar}\` |\n`
        })

        markdown += `\n`
      })
    })
  }

  markdown += `## Usage

### In CSS/SCSS

\`\`\`scss
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  font-family: var(--font-rubik-regular);
}
\`\`\`

### In Vue Components (inline styles)

\`\`\`vue
<script setup lang="ts">
import { useTokens } from '@/composables/useTokens'

const { var: cssVar } = useTokens()
</script>

<template>
  <div :style="{ backgroundColor: cssVar('color-primary') }">
    Content
  </div>
</template>
\`\`\`

### Theme Switching

\`\`\`typescript
import { useTokens } from '@/composables/useTokens'

const { setTheme } = useTokens()

// Switch to dark theme
setTheme('dark')
\`\`\`

## Generation

This documentation is automatically generated from \`src/design/tokens.json\`. To regenerate:

\`\`\`bash
npm run tokens:docs
\`\`\`

---

*Last updated: ${new Date().toISOString()}*
`

  // Write documentation
  const docsPath = join(process.cwd(), 'DESIGN_TOKENS.md')
  writeFileSync(docsPath, markdown)

  console.log('📄 Generated DESIGN_TOKENS.md')
  console.log('✅ Design tokens documentation exported successfully!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDocs().catch(console.error)
}

export { exportDocs }
