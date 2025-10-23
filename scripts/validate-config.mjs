#!/usr/bin/env node

/**
 * Calendar config validation script.
 * Validates src/data/app-config.json for invalid dates and configuration issues.
 * 
 * Usage:
 *   node scripts/validate-config.mjs
 * 
 * Exit codes:
 *   0 - Config is valid
 *   1 - Config has errors (blocks pre-commit)
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const CONFIG_PATH = 'src/data/app-config.json'

/**
 * Strict YYYY-MM-DD parser that validates date existence.
 * Returns null if date doesn't exist (e.g., 2025-11-31).
 */
function parseYMDStrict(dateString) {
  const parts = dateString.split('-').map(Number)
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    return null
  }

  const [y, m, d] = parts
  if (!y || !m || !d) return null

  // Create date and check if it matches input
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }

  return date
}

/**
 * Validates calendar configuration.
 */
function validateConfig(config) {
  const errors = []
  const warnings = []
  
  const { startDate, endDate, firstDayOfWeek } = config.config || {}

  // Validate start date
  if (!startDate) {
    errors.push('Missing startDate in config')
  } else {
    const startParsed = parseYMDStrict(startDate)
    if (!startParsed) {
      errors.push(`Invalid start date: ${startDate} (date does not exist)`)
    }
  }

  // Validate end date
  if (!endDate) {
    errors.push('Missing endDate in config')
  } else {
    const endParsed = parseYMDStrict(endDate)
    if (!endParsed) {
      errors.push(`Invalid end date: ${endDate} (date does not exist)`)
    }
  }

  // Validate date range if both dates exist
  if (startDate && endDate) {
    const startParsed = parseYMDStrict(startDate)
    const endParsed = parseYMDStrict(endDate)
    
    if (startParsed && endParsed) {
      // Check date order
      if (startParsed.getTime() > endParsed.getTime()) {
        errors.push(`Start date (${startDate}) is after end date (${endDate})`)
      }
      
      // Check range length
      const daysDiff = Math.ceil((endParsed.getTime() - startParsed.getTime()) / (1000 * 60 * 60 * 24)) + 1
      if (daysDiff > 92) {
        warnings.push(`Calendar range is very long: ${daysDiff} days (max recommended: 92)`)
      }
    }
  }

  // Validate firstDayOfWeek
  if (firstDayOfWeek && !['auto', 'monday', 'sunday'].includes(firstDayOfWeek)) {
    errors.push(`Invalid firstDayOfWeek: ${firstDayOfWeek}. Must be 'auto', 'monday', or 'sunday'`)
  }

  return { errors, warnings }
}

async function main() {
  try {
    console.log('🔍 Validating calendar configuration...')
    
    // Read config file
    const configPath = path.resolve(CONFIG_PATH)
    const configText = await fs.readFile(configPath, 'utf8')
    const config = JSON.parse(configText)
    
    // Validate configuration
    const { errors, warnings } = validateConfig(config)
    
    // Report warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      warnings.forEach(warning => console.log(`   ${warning}`))
    }
    
    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ Errors found:')
      errors.forEach(error => console.log(`   ${error}`))
      console.log('\n💡 Fix these errors before committing.')
      process.exit(1)
    }
    
    console.log('✅ Configuration is valid!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Failed to validate config:', error.message)
    process.exit(1)
  }
}

main()
