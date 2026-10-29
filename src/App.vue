<script setup lang="ts">
  /**
   * Main application component.
   * Renders calendar banner and content.
   * The banner comes from the active campaign (shared CalendarBanner.vue as fallback).
   */
  import CampaignBanner from '@campaign-banner'
  import CalendarContent from './components/CalendarContent.vue'
  import { useAppConfig } from '@/composables/useAppConfig'

  // Composables.
  const { config } = useAppConfig()
</script>

<template>
  <CampaignBanner v-if="config.ui.bannerSection.visible" />
  <main v-if="config.enabled" class="main">
    <CalendarContent />
  </main>
</template>

<style scoped lang="scss">
  .main {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    width: 100%;
    min-height: 100%;
    margin: 0 auto;
    background-color: var(--color-layer-1);

    @include font-family(primary);
  }
</style>
