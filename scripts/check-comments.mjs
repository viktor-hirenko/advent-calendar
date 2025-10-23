#!/usr/bin/env node

/**
 * Comment Policy Checker — Cyrillic Detection
 *
 * Checks that comments don't contain Cyrillic characters.
 *
 * Usage:
 *   node scripts/check-comments.mjs                    # warning mode (default)
 *   COMMENT_POLICY=strict node scripts/check-comments.mjs  # strict mode (CI)
 */

import { glob } from 'glob'
import { readFile } from 'node:fs/promises'

// Only check source files
const GLOBS = ['src/**/*.{ts,tsx,vue,js}']

// Comment patterns
const reJSDoc = /\/\*\*[\s\S]*?\*\//g
const reInline = /\/\/[^\n]*/g

// Cyrillic detection
const reCyrillic = /\p{Script=Cyrillic}/u

function hasCyrillic(text) {
  // Remove URLs and code blocks before checking
  const cleaned = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\{\{.*?\}\}/g, '')

  return reCyrillic.test(cleaned)
}

function indexToLineCol(text, index) {
  const lines = text.slice(0, index).split('\n')
  const line = lines.length
  const col = lines[lines.length - 1].length + 1
  return { line, col }
}

const violations = []
const files = await glob(GLOBS, { dot: false })

for (const file of files) {
  try {
    const code = await readFile(file, 'utf8')

    // Check JSDoc blocks
    for (const match of code.matchAll(reJSDoc)) {
      const block = match[0]
      if (hasCyrillic(block)) {
        const { line, col } = indexToLineCol(code, match.index || 0)
        violations.push({
          file,
          line,
          col,
          type: 'JSDoc',
          snippet: block.split('\n')[0].slice(0, 80),
        })
      }
    }

    // Check inline comments
    for (const match of code.matchAll(reInline)) {
      const comment = match[0]
      if (hasCyrillic(comment)) {
        const { line, col } = indexToLineCol(code, match.index || 0)
        violations.push({
          file,
          line,
          col,
          type: 'Inline',
          snippet: comment.slice(0, 80),
        })
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${file}: ${error.message}`)
  }
}

// Output results
if (violations.length === 0) {
  console.log('✅ No Cyrillic characters found in comments.')
  process.exit(0)
}

console.log('⚠️  Cyrillic characters found in comments:')
for (const v of violations) {
  console.log(`${v.file}:${v.line}:${v.col}  [${v.type}] ${v.snippet}`)
}

// Check if strict mode is enabled
const isStrict = process.env.COMMENT_POLICY === 'strict'
if (isStrict) {
  console.log(`\n❌ Found ${violations.length} violations. Failing in strict mode.`)
  process.exit(1)
} else {
  console.log(`\n⚠️  Found ${violations.length} violations (warning mode).`)
  process.exit(0)
}
