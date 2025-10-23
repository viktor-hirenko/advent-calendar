<script setup lang="ts">
  /**
   * CalendarBanner — responsive hero banner with localized alt text.
   *
   * Key behaviors:
   * - Responsive image with multiple breakpoints (mobile/tablet/desktop/large/ultra)
   * - Localized alt text from configuration
   *
   * Props: none (uses global app config)
   * Emits: none
   * A11y: role="banner", aria-label, proper alt text
   * Side effects: none
   */
  import { useAppConfig } from '@/composables/useAppConfig'

  // Composables
  const { calendarData, resolveImg, getLocalizedText } = useAppConfig()
</script>

<template>
  <div
    class="calendar-banner"
    role="banner"
    aria-label="Calendar banner"
    :style="{
      '--decor-url': `url(${resolveImg(calendarData.images?.decoration?.ultra || '')})`,
    }"
  >
    <picture class="calendar-banner__picture">
      <source
        media="(min-width: 2880px)"
        :srcset="resolveImg(calendarData.images?.banner?.ultra || '')"
        type="image/webp"
      />
      <source
        media="(min-width: 1440px)"
        :srcset="resolveImg(calendarData.images?.banner?.large || '')"
        type="image/webp"
      />
      <source
        media="(min-width: 1024px)"
        :srcset="resolveImg(calendarData.images?.banner?.desktop || '')"
        type="image/webp"
      />
      <source
        media="(min-width: 360px)"
        :srcset="resolveImg(calendarData.images?.banner?.tablet || '')"
        type="image/webp"
      />
      <source
        media="(max-width: 359px)"
        :srcset="resolveImg(calendarData.images?.banner?.mobile || '')"
        type="image/webp"
      />
      <img
        :src="resolveImg(calendarData.images?.banner?.mobile || '')"
        :alt="
          calendarData.images?.banner?.alt ? getLocalizedText(calendarData.images.banner.alt) : ''
        "
        width="640"
        height="320"
        decoding="async"
        fetchpriority="high"
        class="calendar-banner__image"
      />
    </picture>
  </div>
</template>

<style scoped lang="scss">
  .calendar-banner {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: to-rem(320px);
    background: linear-gradient(270deg, #ff7b52 0%, #ff1555 0.01%, #712df4 99.99%, #35aaff 100%);

    &__picture {
      display: block;
      width: 100%;
      height: 100%;
    }

    &__image {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;

      @include mq(md) {
        object-fit: contain;
        object-position: right;
      }

      @include mq(xxxl) {
        padding-inline: to-percent-x(328px, $design-width-large)
          to-percent-x(224px, $design-width-large);
        object-position: inherit;
      }

      @include mq(ultra) {
        padding-inline: to-percent-x(1862px, $design-width-ultra)
          to-percent-x(222px, $design-width-ultra);
        object-fit: fill;
      }
    }

    &::after {
      @include mq(ultra) {
        position: absolute;
        inset: 0 auto 0 0;
        top: 0;
        left: to-percent-x(1331px, $design-width-ultra);
        z-index: 1;
        width: to-percent-x(1548px, $design-width-ultra);
        height: 100%;
        background-image: var(--decor-url);
        background-size: 100% 100%;
        background-position: left top;
        background-repeat: no-repeat;
        pointer-events: none;
        content: '';
      }
    }

    @include mq(md) {
      height: 320px;
      background: linear-gradient(270deg, #ff7b52 0%, #ff1555 0.01%, #712df4 63.02%, #35aaff 100%);
    }

    @include mq(xl) {
      height: to-rem(312px);
      background: linear-gradient(270deg, #ff7b52 0%, #ff1555 0.01%, #712df4 51.04%, #35aaff 100%);
    }

    @include mq(xxxl) {
      height: to-rem(320px);
      background: linear-gradient(270deg, #ff7b52 0%, #ff1555 26.04%, #712df4 72.4%, #35aaff 100%);
    }

    @include mq(ultra) {
      height: 320px;
      background: linear-gradient(270deg, #ff7b52 0%, #ff1555 26.04%, #712df4 72.4%, #35aaff 100%);
    }
  }
</style>
