#!/usr/bin/env node

/**
 * Calendar config validation script.
 * Validates campaigns/<id>/config.json for invalid dates and configuration issues.
 * 
 * Usage:
 *   node scripts/validate-config.mjs
 *   CAMPAIGN=<id> node scripts/validate-config.mjs
 *   node scripts/validate-config.mjs --strict
 *
 * Strict mode (--strict or "strictValidation": true in campaign.json) turns these into errors:
 *   - number of tasks differs from the number of days in the period
 *   - a localized text has no English ("en") value
 *   - an image referenced from config.json is missing in campaigns/<id>/images/
 *   - task ids are missing or repeated
 *
 * Exit codes:
 *   0 - Config is valid
 *   1 - Config has errors (blocks pre-commit)
 */

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveCampaign } from './campaign.mjs'

const LANGUAGE_KEYS = ['en', 'de', 'fr', 'it', 'es', 'pt']

/**
 * Collects localized text objects (only language keys: en, de, ...) found anywhere inside a value.
 * Returns pairs of [path, object].
 */
function collectLocalizedTexts(value, path = 'calendar', out = []) {
  if (!value || typeof value !== 'object') return out
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectLocalizedTexts(item, `${path}[${i}]`, out))
    return out
  }
  const keys = Object.keys(value)
  const isLocalized =
    keys.length > 0 &&
    keys.every((key) => LANGUAGE_KEYS.includes(key) && typeof value[key] === 'string')
  if (isLocalized) {
    out.push([path, value])
    return out
  }
  keys.forEach((key) => collectLocalizedTexts(value[key], `${path}.${key}`, out))
  return out
}

/**
 * Lists image paths referenced from the calendar section (relative to images/).
 */
function collectImagePaths(calendar) {
  const paths = []
  const add = (path, value) => {
    if (typeof value === 'string' && value && !/^(https?:)?\/\//.test(value)) paths.push([path, value])
  }
  const images = calendar.images || {}
  for (const [key, value] of Object.entries(images.banner || {})) {
    if (key !== 'alt') add(`images.banner.${key}`, value)
  }
  for (const [key, value] of Object.entries(images.decoration || {})) {
    add(`images.decoration.${key}`, value)
  }
  add('images.disabledTaskIcon', images.disabledTaskIcon)
  add('disabledTask.image', calendar.disabledTask?.image)
  ;(calendar.tasks || []).forEach((task, i) => add(`tasks[${i}].image`, task.image))
  for (const [type, value] of Object.entries(calendar.taskTypes || {})) {
    add(`taskTypes.${type}.image`, value?.image)
    add(`taskTypes.${type}.finishedImage`, value?.finishedImage)
  }
  return paths
}

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
function validateConfig(config, { strict = false, imagesDir } = {}) {
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

  const { localizeDates } = config.config || {}
  if (localizeDates !== undefined && typeof localizeDates !== 'boolean') {
    errors.push(`Invalid localizeDates: ${localizeDates}. Must be true or false`)
  }

  const calendar = config.calendar || {}
  const tasks = Array.isArray(calendar.tasks) ? calendar.tasks : []
  // Strict findings are errors; otherwise they are reported as warnings
  const report = strict ? errors : warnings

  // Task count vs number of days
  const startParsed = startDate && parseYMDStrict(startDate)
  const endParsed = endDate && parseYMDStrict(endDate)
  if (startParsed && endParsed && startParsed <= endParsed) {
    const days = Math.round((endParsed.getTime() - startParsed.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (tasks.length !== days) {
      report.push(`${tasks.length} tasks for ${days} days: tasks repeat or are not shown`)
    }
  }

  // Task ids and types
  const ids = new Set()
  tasks.forEach((task, i) => {
    if (!task.id) report.push(`tasks[${i}] has no id`)
    else if (ids.has(task.id)) report.push(`tasks[${i}]: id "${task.id}" is repeated`)
    ids.add(task.id)
    if (task.type !== undefined && (typeof task.type !== 'string' || !task.type)) {
      errors.push(`tasks[${i}].type must be a non-empty string`)
    } else if (task.type && calendar.taskTypes && !calendar.taskTypes[task.type]) {
      report.push(`tasks[${i}].type "${task.type}" is not listed in calendar.taskTypes`)
    }
  })

  for (const [type, value] of Object.entries(calendar.taskTypes || {})) {
    if (!value || typeof value.image !== 'string' || !value.image) {
      errors.push(`calendar.taskTypes.${type}.image must be a non-empty string`)
    }
  }

  const finishedCardButton = config.config?.ui?.calendarSection?.finishedCardButton
  if (finishedCardButton !== undefined && !['task', 'returnToToday'].includes(finishedCardButton)) {
    errors.push(`Invalid ui.calendarSection.finishedCardButton: ${finishedCardButton}. Must be 'task' or 'returnToToday'`)
  }

  // English is the fallback language for every localized text
  for (const [path, text] of collectLocalizedTexts(calendar)) {
    if (!text.en) report.push(`${path} has no English ("en") text`)
  }

  // Referenced images must exist in the campaign images/ folder
  if (imagesDir) {
    for (const [path, file] of collectImagePaths(calendar)) {
      if (!existsSync(join(imagesDir, file))) report.push(`${path}: image not found: ${file}`)
    }
  }

  return { errors, warnings }
}

async function main() {
  try {
    const campaign = resolveCampaign()
    const strict = campaign.strictValidation || process.argv.includes('--strict')
    console.log(
      `🔍 Validating calendar configuration (campaign: ${campaign.id}${strict ? ', strict' : ''})...`,
    )

    // Read config file
    const configText = await fs.readFile(campaign.configPath, 'utf8')
    const config = JSON.parse(configText)

    // Validate configuration
    const { errors, warnings } = validateConfig(config, { strict, imagesDir: campaign.imagesDir })
    
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
