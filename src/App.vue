<script setup lang="ts">
  /**
   * Main application component.
   * Renders calendar banner and content with event handlers.
   */
  import CalendarBanner from './components/CalendarBanner.vue'
  import CalendarContent from './components/CalendarContent.vue'
  import { useAppConfig } from '@/composables/useAppConfig'
  import type { CalendarDay } from '@/types/app-config'
  import { devLog } from '@/utils/devLog'

  // Composables
  const { config } = useAppConfig()

  /**
   * Handles day selection events.
   * @param day - Selected calendar day
   */
  function handleDayClick(day: CalendarDay) {
    devLog('Day clicked:', day)
    // Here you can add logic for handling day selection
  }

  /**
   * Handles terms and conditions click events.
   */
  function handleTermsClick() {
    devLog('Terms and conditions clicked')
    // Here you can add logic for opening terms and conditions
  }
</script>

<template>
  <CalendarBanner v-if="config.ui.bannerSection.visible" />
  <main v-if="config.enabled" class="main">
    <CalendarContent @day-click="handleDayClick" @terms-click="handleTermsClick" />
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
