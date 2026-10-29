/// <reference types="vite/client" />

/** Active campaign settings (campaigns/<id>/config.json), resolved by the `@campaign` alias. */
declare module '@campaign/config.json' {
  const config: unknown
  export default config
}

/** Active campaign banner (campaigns/<id>/components/CampaignBanner.vue or the shared CalendarBanner.vue). */
declare module '@campaign-banner' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}
