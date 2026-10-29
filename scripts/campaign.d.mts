export interface ResolvedCampaign {
  id: string
  dir: string
  configPath: string
  imagesDir: string
  bannerPath: string | null
  theme: string
  fontsUrl: string
}

export const ROOT_DIR: string
export const CAMPAIGNS_DIR: string
export const DEFAULT_CAMPAIGN: string

export function listCampaigns(): string[]
export function resolveCampaign(id?: string): ResolvedCampaign
