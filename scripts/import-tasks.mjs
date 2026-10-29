#!/usr/bin/env node

/**
 * Imports calendar tasks from a CSV export of the tasks sheet into campaigns/<id>/config.json.
 *
 * Usage:
 *   CAMPAIGN=alpa-2026 node scripts/import-tasks.mjs path/to/tasks.csv
 *   CAMPAIGN=alpa-2026 node scripts/import-tasks.mjs path/to/tasks.csv --dry-run
 *
 * Expected columns (header row, Ukrainian names as in the sheet):
 *   День, Дата, Тип, Назва картки, Подія / прив'язка, Умова для гравця, CTA
 *
 * Each row becomes a task:
 *   id          "day-01" … from «День»
 *   type        from «Тип»: Ставка → bet, Депозит → deposit, Лайв → live, Промокод → promo,
 *               Комбо → combo-football when the condition or the event is about football
 *               (football, Champions/Europa/Conference League, UEFA) and does not say
 *               "any sport"; other combos → combo
 *   title.en    «Назва картки»
 *   description.en  «Умова для гравця», amounts like €20 wrapped in <strong>
 *   buttonText.en   «CTA»
 *
 * calendar.tasks is replaced as a whole; other parts of config.json stay as they are.
 * The dates in «Дата» are checked against config.startDate; mismatches are reported.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolveCampaign } from './campaign.mjs'

const TYPE_BY_SHEET_VALUE = {
  Ставка: 'bet',
  Депозит: 'deposit',
  Лайв: 'live',
  Промокод: 'promo',
  Комбо: 'combo',
}

const FOOTBALL_PATTERN = /football|champions league|europa league|conference league|uefa/i
const ANY_SPORT_PATTERN = /any sport/i

/**
 * Parses CSV text (RFC 4180: quoted fields, doubled quotes, CRLF or LF line ends).
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Escapes text for safe use inside HTML.
 */
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Wraps euro amounts (€5, €20, €1.50) in <strong>.
 */
function boldAmounts(html) {
  return html.replace(/€\d+(?:[.,]\d+)?/g, (amount) => `<strong>${amount}</strong>`)
}

/**
 * Maps the sheet type, condition and event to a task type.
 */
function taskType(sheetType, condition, event) {
  const type = TYPE_BY_SHEET_VALUE[sheetType.trim()]
  if (!type) throw new Error(`Unknown task type in the sheet: "${sheetType}"`)
  if (type !== 'combo') return type
  if (ANY_SPORT_PATTERN.test(condition)) return 'combo'
  return FOOTBALL_PATTERN.test(`${condition} ${event}`) ? 'combo-football' : 'combo'
}

/**
 * Returns YYYY-MM-DD for the day `offset` days after a YYYY-MM-DD start date.
 */
function addDays(ymd, offset) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + offset))
  return date.toISOString().slice(0, 10)
}

function main() {
  const args = process.argv.slice(2)
  const csvPath = args.find((arg) => !arg.startsWith('--'))
  const dryRun = args.includes('--dry-run')
  if (!csvPath) {
    console.error('Usage: CAMPAIGN=<id> node scripts/import-tasks.mjs <tasks.csv> [--dry-run]')
    process.exit(1)
  }

  const campaign = resolveCampaign()
  const rows = parseCsv(readFileSync(csvPath, 'utf8'))
  const headerIndex = rows.findIndex((row) => row[0]?.trim() === 'День')
  if (headerIndex === -1) throw new Error('Header row with «День» not found')

  const header = rows[headerIndex].map((cell) => cell.trim())
  const col = (name) => {
    const index = header.indexOf(name)
    if (index === -1) throw new Error(`Column «${name}» not found`)
    return index
  }
  const columns = {
    day: col('День'),
    date: col('Дата'),
    type: col('Тип'),
    title: col('Назва картки'),
    event: col("Подія / прив'язка"),
    condition: col('Умова для гравця'),
    cta: col('CTA'),
  }

  const config = JSON.parse(readFileSync(campaign.configPath, 'utf8'))
  const startDate = config.config?.startDate
  const warnings = []

  const tasks = rows
    .slice(headerIndex + 1)
    .filter((row) => /^\d+$/.test(row[columns.day]?.trim() ?? ''))
    .map((row) => {
      const day = Number(row[columns.day].trim())
      const condition = row[columns.condition].trim()

      if (startDate) {
        const [dd, mm, yyyy] = row[columns.date].trim().split('.')
        const expected = addDays(startDate, day - 1)
        if (`${yyyy}-${mm}-${dd}` !== expected) {
          warnings.push(`Day ${day}: sheet date ${row[columns.date]} differs from ${expected}`)
        }
      }

      return {
        id: `day-${String(day).padStart(2, '0')}`,
        type: taskType(row[columns.type], condition, row[columns.event]),
        title: { en: row[columns.title].trim() },
        description: { en: boldAmounts(escapeHtml(condition)) },
        buttonText: { en: row[columns.cta].trim() },
      }
    })

  console.log(`📋 ${tasks.length} tasks from ${csvPath} → campaign ${campaign.id}`)
  for (const task of tasks) {
    console.log(`   ${task.id}  ${task.type.padEnd(14)} ${task.title.en}`)
  }
  warnings.forEach((warning) => console.log(`⚠️  ${warning}`))

  if (dryRun) {
    console.log('Dry run: config.json not changed')
    return
  }

  config.calendar.tasks = tasks
  writeFileSync(campaign.configPath, `${JSON.stringify(config, null, 2)}\n`)
  console.log(`✅ Written to ${campaign.configPath}`)
}

main()
