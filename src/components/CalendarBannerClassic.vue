<script setup lang="ts">
  /**
   * CalendarBannerClassic — static banner matching legacy Advent layout.
   *
   * Key behaviors:
   * - Mobile/desktop imagery switch at md breakpoint
   * - Decorative gradient overlay for ultra-wide desktops
   * - Localized alt text taken from app-config
   *
   * Props: none
   * Emits: none
   */
  import { computed } from 'vue'
  import { useAppConfig } from '@/composables/useAppConfig'

  import mobileBanner from '@/assets/images/banners/classic/calendar_mobile.webp'
  import desktopBanner from '@/assets/images/banners/classic/calendar.webp'
  import gradientLayer from '@/assets/images/banners/classic/gradient.svg'

  const { calendarData, getLocalizedText } = useAppConfig()

  const bannerAlt = computed(() => {
    const altText = calendarData.value.images?.banner?.alt
    if (!altText) {
      return 'Sports calendar banner'
    }

    return getLocalizedText(altText)
  })
</script>

<template>
  <section class="calendar-banner-classic" role="banner" :aria-label="bannerAlt">
    <img
      class="calendar-banner-classic__image calendar-banner-classic__image--mobile"
      :src="mobileBanner"
      :alt="bannerAlt"
      width="640"
      height="320"
      decoding="async"
      fetchpriority="high"
    />

    <img
      class="calendar-banner-classic__image calendar-banner-classic__image--desktop"
      :src="desktopBanner"
      :alt="bannerAlt"
      width="1440"
      height="320"
      decoding="async"
      loading="lazy"
    />

    <img
      class="calendar-banner-classic__gradient"
      :src="gradientLayer"
      alt=""
      aria-hidden="true"
      width="1320"
      height="320"
      loading="lazy"
      decoding="async"
    />
  </section>
</template>

<style scoped lang="scss">
  .calendar-banner-classic {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    height: to-rem(320px);
    overflow: hidden;
    background: linear-gradient(90deg, #4481eb 0%, #4481eb 45%, #5cdacc 55%, #5cdacc 100%);

    &__image {
      position: relative;
      width: auto;
      height: 100%;
      object-fit: cover;
      object-position: center;

      &--desktop {
        display: none;
      }
    }

    &__gradient {
      display: none;
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: auto;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    @include mq(md) {
      &__image {
        &--mobile {
          display: none;
        }

        &--desktop {
          display: block;
        }
      }
    }

    @include mq(xxxl) {
      &__gradient {
        display: block;
      }
    }
  }
</style>
