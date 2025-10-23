<script setup lang="ts">
  /**
   * Calendar days component for displaying month days.
   * Renders clickable day buttons with active/selected states.
   */
  import type { CalendarDay } from '@/types/design'

  /**
   * Props for CalendarDays component.
   */
  interface CalendarDaysProps {
    month: string
    days: CalendarDay[]
  }

  /**
   * Emits for CalendarDays component.
   */
  interface CalendarDaysEmits {
    'day-click': [day: CalendarDay]
  }

  defineProps<CalendarDaysProps>()
  const emit = defineEmits<CalendarDaysEmits>()

  function handleDayClick(day: CalendarDay) {
    emit('day-click', day)
  }
</script>

<template>
  <div class="calendar-days">
    <div class="calendar-days__container" role="listbox" aria-label="Calendar days">
      <template
        v-for="(day, i) in days"
        :key="day.isPlaceholder ? `ph-${month}-${i}` : `d-${day.id}`"
      >
        <!-- плейсхолдер: без дати, без кліку, лише займає клітинку -->
        <div v-if="day.isPlaceholder" class="calendar-days__placeholder" aria-hidden="true" />

        <!-- реальний день -->
        <button
          v-else
          :data-day-id="day.id"
          :data-date="day.date"
          :class="[
            'calendar-days__day',
            {
              'calendar-days__day--active': day.isActive,
              'calendar-days__day--selected': day.isSelected,
            },
          ]"
          :aria-selected="day.isSelected"
          :aria-current="day.isToday ? 'date' : undefined"
          :aria-label="`${day.day}, ${month}`"
          role="option"
          @click="handleDayClick(day)"
        >
          {{ day.day }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .calendar-days {
    display: flex;
    width: 100%;
    flex-direction: column;

    // align-items: center;
    gap: to-rem(16px);

    @include mq(lg) {
      align-items: start;
    }

    &__container {
      display: flex;
      overflow-x: auto;
      gap: to-rem(8px);
      -ms-overflow-style: none;
      padding-inline-end: to-rem(16px);
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      @include mq(lg) {
        display: grid;
        max-width: to-rem(405px);
        gap: to-rem(8px);
        grid-template-columns: repeat(7, 1fr); // Mon..Sun
        padding-inline-end: 0;
      }
    }

    // Spacer not used

    &__placeholder {
      width: to-rem(51px);
      height: to-rem(40px);
      border-radius: to-rem(100px);
      opacity: 0; // invisible but holds space in grid
      pointer-events: none; // not interactive
    }

    &__day {
      display: flex;
      width: to-rem(51px);
      height: to-rem(40px);
      padding: to-rem(8px) to-rem(16px);
      justify-content: center;
      align-items: center;
      border: 1px solid transparent;
      border-radius: to-rem(100px);
      background-color: rgb(182 189 204 / 20%);
      color: var(--color-text-secondary);
      cursor: pointer;

      transition:
        transform 200ms ease,
        opacity 200ms ease,
        background-color 200ms ease;
      @include text('button-small', $size: size(sm));

      &:hover {
        background-color: rgb(182 189 204 / 30%);
      }

      &--active {
        background-color: var(--color-button-tertiary);
        color: var(--color-text-primary);

        &:hover {
          background-color: color-mix(in srgb, var(--color-button-tertiary) 80%, black 20%);
        }
      }

      &--selected {
        border-color: var(--color-button-tertiary);
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }
  }
</style>
