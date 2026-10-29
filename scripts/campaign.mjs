/**
 * Campaign resolution shared by vite.config.ts and the build scripts.
 *
 * A campaign is a folder under campaigns/<id>/ with:
 * - campaign.json: build-time data (theme, fonts stylesheet URL, optional strictValidation)
 * - config.json: calendar settings and texts
 * - images/: images referenced from config.json
 * - components/CampaignBanner.vue (optional): replaces the shared CalendarBanner.vue
 * - styles.scss (optional): campaign look, loaded after the shared styles
 *
 * The campaign is selected with the CAMPAIGN environment variable;
 * without it DEFAULT_CAMPAIGN is used.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const CAMPAIGNS_DIR = join(ROOT_DIR, 'campaigns')
export const DEFAULT_CAMPAIGN = 'alpa-2026'

/**
 * Lists campaign ids (folders that contain campaign.json).
 */
export function listCampaigns() {
  return readdirSync(CAMPAIGNS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(CAMPAIGNS_DIR, id, 'campaign.json')))
    .sort()
}

/**
 * Resolves a campaign by id (defaults to CAMPAIGN env or DEFAULT_CAMPAIGN).
 * Throws with the list of available campaigns when the id is unknown
 * or campaign.json misses required fields.
 */
export function resolveCampaign(id = process.env.CAMPAIGN || DEFAULT_CAMPAIGN) {
  const available = listCampaigns()
  if (!available.includes(id)) {
    throw new Error(
      `Unknown campaign "${id}". Available: ${available.join(', ') || '(none)'}. ` +
        `Set CAMPAIGN=<id> or add campaigns/<id>/campaign.json.`,
    )
  }

  const dir = join(CAMPAIGNS_DIR, id)
  const meta = JSON.parse(readFileSync(join(dir, 'campaign.json'), 'utf8'))

  for (const field of ['theme', 'fontsUrl']) {
    if (typeof meta[field] !== 'string' || !meta[field]) {
      throw new Error(`campaigns/${id}/campaign.json: "${field}" must be a non-empty string`)
    }
  }

  const bannerPath = join(dir, 'components', 'CampaignBanner.vue')
  const stylesPath = join(dir, 'styles.scss')

  return {
    id,
    dir,
    configPath: join(dir, 'config.json'),
    imagesDir: join(dir, 'images'),
    bannerPath: existsSync(bannerPath) ? bannerPath : null,
    stylesPath: existsSync(stylesPath) ? stylesPath : null,
    theme: meta.theme,
    fontsUrl: meta.fontsUrl,
    // Strict config checks in validate-config (task count, English texts, image files)
    strictValidation: meta.strictValidation === true,
  }
}
