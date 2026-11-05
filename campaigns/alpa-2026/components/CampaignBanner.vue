<script setup lang="ts">
  /**
   * CampaignBanner — Alpa 2026 hero: the night city across the whole width and the stadium in the middle.
   *
   * Key behaviors:
   * - The city keeps its size and stays centered; on very wide screens its sides fade into the page
   * - The stadium keeps its height: 208px up to 1079px, 256px from 1080px
   * - Localized alt text taken from app-config
   *
   * Props: none
   * Emits: none
   */
  import { computed } from 'vue'
  import { useAppConfig } from '@/composables/useAppConfig'

  import stadium from '../images/hero/stadium.webp'

  const { calendarData, currentLanguage, getLocalizedText } = useAppConfig()

  const bannerAlt = computed(() => {
    const alt = calendarData.value.images?.banner?.alt
    return alt ? getLocalizedText(alt, currentLanguage.value) : ''
  })
</script>

<template>
  <section class="hero" role="banner" :aria-label="bannerAlt">
    <img
      class="hero__stadium"
      :src="stadium"
      :alt="bannerAlt"
      width="512"
      height="256"
      decoding="async"
      fetchpriority="high"
    />
  </section>
</template>

<style scoped lang="scss">
  .hero {
    position: relative;
    display: flex;
    overflow: hidden;
    width: 100%;
    height: to-rem(208px);
    justify-content: center;
    background-color: var(--bg-page);

    @include mq(1080px) {
      height: to-rem(256px);
    }

    // The city keeps its own size (3320x512 picture at the hero height). On screens wider
    // than about 1440px its sides fade into the page; up to that width the fade stays off screen.
    &::before {
      position: absolute;
      top: 0;
      left: 50%;
      height: 100%;
      background: url('../images/hero/background.webp') center / 100% 100% no-repeat;
      transform: translateX(-50%);
      content: '';
      aspect-ratio: 3320 / 512;
      mask-image: linear-gradient(
        90deg,
        transparent 0,
        #000 #{to-rem(110px)},
        #000 calc(100% - #{to-rem(110px)}),
        transparent 100%
      );
    }

    &__stadium {
      position: relative;
      display: block;
      width: auto;
      max-width: none;
      height: 100%;
      flex-shrink: 0;
    }
  }
</style>
