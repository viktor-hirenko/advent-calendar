<script setup lang="ts">
  /**
   * CampaignBanner — Santa Vegas 2026 banner, one picture for phones and one for wider screens.
   *
   * Key behaviors:
   * - Phone picture below the md breakpoint, desktop picture from md (same switch as the 2025 banner)
   * - The picture stays centered; on screens wider than the picture the sky continues on the sides
   * - Localized alt text taken from app-config
   *
   * Props: none
   * Emits: none
   */
  import { computed } from 'vue'
  import { useAppConfig } from '@/composables/useAppConfig'

  import mobileBanner from '../images/banner/mobile.webp'
  import desktopBanner from '../images/banner/desktop.webp'

  const { calendarData, currentLanguage, getLocalizedText } = useAppConfig()

  const bannerAlt = computed(() => {
    const alt = calendarData.value.images?.banner?.alt
    return alt ? getLocalizedText(alt, currentLanguage.value) : ''
  })
</script>

<template>
  <section class="santa-banner" role="banner" :aria-label="bannerAlt">
    <picture class="santa-banner__picture">
      <source media="(min-width: 600px)" :srcset="desktopBanner" width="1440" height="360" />
      <img
        class="santa-banner__image"
        :src="mobileBanner"
        :alt="bannerAlt"
        width="1180"
        height="295"
        decoding="async"
        fetchpriority="high"
      />
    </picture>
  </section>
</template>

<style scoped lang="scss">
  .santa-banner {
    display: flex;
    overflow: hidden;
    width: 100%;
    height: to-rem(295px);
    justify-content: center;

    // Sky of the banner frame in the design: it fills the sides when the screen is wider than the picture
    background: linear-gradient(
      180deg,
      #0f0a41 0%,
      #1b125f 10%,
      #27197c 17.4%,
      #522c9e 26.6%,
      #843faf 35.3%,
      #de5796 50.4%,
      #ef8372 54.7%,
      #ff9c60 59.9%,
      #ff8060 67.3%,
      #de5796 76%,
      #843faf 84.8%,
      #522c9e 89.3%,
      #100a41 100%
    );

    @include mq(md) {
      height: to-rem(360px);
    }

    &__picture {
      display: block;
      height: 100%;
      flex-shrink: 0;
    }

    // The phone frame of the design shows the picture 36px right of its center
    &__image {
      display: block;
      width: auto;
      max-width: none;
      height: 100%;
      transform: translateX(to-rem(36px));

      @include mq(md) {
        transform: none;
      }

      // Wider than the picture: its side edges fade into the sky
      @media (width >= 1441px) {
        mask-image: linear-gradient(
          90deg,
          transparent 0,
          #000 to-rem(160px),
          #000 calc(100% - #{to-rem(160px)}),
          transparent 100%
        );
      }
    }
  }
</style>
