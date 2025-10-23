<script setup lang="ts">
  /**
   * Task card component with timer and status display.
   * Handles active, disabled, and finished states with countdown timer.
   */

  // Vue imports
  import { computed, ref, watchEffect, onScopeDispose } from 'vue'

  // Composables and utilities
  import { useAppConfig } from '@/composables/useAppConfig'
  import { sanitizeHtml } from '@/utils/sanitizeHtml'

  // Type imports
  import type { TaskCard, SupportedLanguage } from '@/types/app-config'

  // Props and Emits
  interface TaskCardProps {
    task: TaskCard
    taskIndex: number
    language: SupportedLanguage
  }

  interface TaskCardEmits {
    'button-click': [task: TaskCard]
  }

  const props = defineProps<TaskCardProps>()
  const emit = defineEmits<TaskCardEmits>()

  // Constants and Types
  const STATUS = {
    ACTIVE: 'active',
    DISABLED: 'disabled',
    FINISHED: 'finished',
  } as const

  type Status = (typeof STATUS)[keyof typeof STATUS]

  // Composables
  const {
    getLocalizedText,
    config,
    calendarData,
    getTaskDate,
    formatTaskDate,
    formatDisabledTaskDate,
    parseYMD,
    ymd,
    resolveTargetUrl,
    resolveImg,
    currentDate,
  } = useAppConfig()

  // State and Refs
  const currentTime = ref(new Date())

  // Computed properties
  const taskUrl = computed(() => resolveTargetUrl(props.task))
  const isUTC = computed(() => config.value.timeMode === 'utc')

  // Date calculations
  const taskDate = computed(() => getTaskDate(props.taskIndex, config.value.startDate))
  const formattedDate = computed(() => formatTaskDate(taskDate.value))
  const formattedDisabledDate = computed(() => formatDisabledTaskDate(taskDate.value))

  // Status calculations
  const status = computed<Status>(() => {
    // Use time-mode aware "today" from currentDate
    const today = parseYMD(ymd(currentDate.value))
    setStartOfDay(today)

    const t = parseYMD(taskDate.value)
    setStartOfDay(t)

    if (t.getTime() === today.getTime()) return STATUS.ACTIVE
    if (t < today) return STATUS.FINISHED
    return STATUS.DISABLED
  })

  const isTaskActive = computed(() => status.value === STATUS.ACTIVE)
  const isTaskFinished = computed(() => status.value === STATUS.FINISHED)
  const isTaskDisabled = computed(() => status.value === STATUS.DISABLED)

  // Day unit localization
  const dayUnit = computed(() =>
    getLocalizedText(calendarData.value.taskStatus?.dayUnit || { en: 'd' }, props.language),
  )

  // Timer
  const timer = computed(() => {
    if (!isTaskActive.value) return undefined

    const now = currentTime.value
    const taskDateObj = parseYMD(taskDate.value)
    setEndOfDay(taskDateObj)

    const timeLeft = taskDateObj.getTime() - now.getTime()

    if (timeLeft <= 0) return undefined

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    const dd = days.toString().padStart(2, '0')
    const hh = hours.toString().padStart(2, '0')
    const mm = minutes.toString().padStart(2, '0')
    const ss = seconds.toString().padStart(2, '0')

    const core = days > 0 ? `${dd}${dayUnit.value} ${hh} : ${mm} : ${ss}` : `${hh} : ${mm} : ${ss}`

    return `${finishesInText.value}: ${core}`
  })

  // Badge calculations
  const badgeVariant = computed<'active' | 'finished' | 'none'>(() => {
    if (isTaskActive.value && timer.value) return 'active'
    if (isTaskFinished.value) return 'finished'
    return 'none'
  })

  const badgeText = computed<string | null>(() => {
    if (badgeVariant.value === 'active') return timer.value ?? null
    if (badgeVariant.value === 'finished') return finishedText.value
    return null
  })

  // Localized content
  const title = computed(() => getLocalizedText(props.task.title, props.language))
  const description = computed(() => getLocalizedText(props.task.description, props.language))
  const sanitizedDescription = computed(() => sanitizeHtml(description.value))
  const buttonText = computed(() => getLocalizedText(props.task.buttonText, props.language))

  const finishesInText = computed(() => {
    const taskStatus = calendarData.value.taskStatus
    return getLocalizedText(taskStatus?.finishesIn || { en: 'Finishes in' }, props.language)
  })

  const finishedText = computed(() => {
    const taskStatus = calendarData.value.taskStatus
    return getLocalizedText(taskStatus?.finished || { en: 'Finished' }, props.language)
  })

  const disabledTitle = computed(() =>
    getLocalizedText(calendarData.value.disabledTask.title, props.language),
  )

  const disabledButtonText = computed(() =>
    getLocalizedText(calendarData.value.disabledTask.buttonText, props.language),
  )

  const disabledImage = computed(() => resolveImg(calendarData.value.images?.disabledTaskIcon))

  const contentTitle = computed(() => {
    return isTaskDisabled.value ? disabledTitle.value : title.value
  })

  const contentDescription = computed(() => {
    return isTaskDisabled.value ? formattedDisabledDate.value : sanitizedDescription.value
  })

  const contentIsHtml = computed(() => {
    return !isTaskDisabled.value
  })

  /**
   * Sets time to start of day considering UTC mode.
   * @param d - Date to modify
   */
  function setStartOfDay(d: Date) {
    if (isUTC.value) d.setUTCHours(0, 0, 0, 0)
    else d.setHours(0, 0, 0, 0)
  }

  /**
   * Sets time to end of day considering UTC mode.
   * @param d - Date to modify
   */
  function setEndOfDay(d: Date) {
    if (isUTC.value) d.setUTCHours(23, 59, 59, 999)
    else d.setHours(23, 59, 59, 999)
  }

  /**
   * Handles button click events.
   * Allows native navigation for active tasks with links,
   * otherwise emits event to parent component.
   */
  function handleButtonClick() {
    if (isTaskActive.value && taskUrl.value) {
      return
    }
    emit('button-click', props.task)
  }

  // Timer management
  let timerInterval: number | null = null

  /**
   * WatchEffect for timer management.
   * Starts interval when card is active, cleans up when inactive.
   */
  watchEffect((onCleanup) => {
    if (isTaskActive.value) {
      timerInterval = window.setInterval(() => {
        currentTime.value = new Date()
      }, 1000)

      onCleanup(() => {
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }
      })
    }
  })

  /**
   * Component cleanup hook.
   * Ensures timer interval is cleared on component unmount.
   */
  onScopeDispose(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  })
</script>

<template>
  <article
    :class="[
      'task-card',
      {
        'task-card--active': isTaskActive,
        'task-card--disabled': isTaskDisabled,
        'task-card--finished': isTaskFinished,
      },
    ]"
    :data-date="taskDate"
  >
    <div v-if="isTaskActive || isTaskFinished" class="task-card__header">
      <div class="task-card__date">{{ formattedDate }}</div>

      <!-- Status badge for active (with timer) and completed tasks
      Accessibility note: aria-live="off" disables screenreader announcements for the active timer
      because the timer updates every second and would otherwise spam the user. For static finished
      state, aria-live is omitted. -->
      <div
        v-if="badgeText"
        class="task-card__badge"
        :class="`task-card__badge--${badgeVariant}`"
        :aria-live="badgeVariant === 'active' ? 'off' : undefined"
        :role="badgeVariant === 'finished' ? 'status' : undefined"
      >
        <span class="task-card__badge-dot" />
        <span class="task-card__badge-text">{{ badgeText }}</span>
      </div>
    </div>

    <div class="task-card__content">
      <!-- Unified content for all card states -->
      <h4 class="task-card__title">{{ contentTitle }}</h4>
      <p v-if="contentIsHtml" class="task-card__description" v-html="contentDescription"></p>
      <p v-else class="task-card__description">{{ contentDescription }}</p>
    </div>

    <component
      :is="isTaskActive && taskUrl ? 'a' : 'button'"
      class="task-card__button"
      :href="isTaskActive && taskUrl ? taskUrl : undefined"
      :target="isTaskActive && taskUrl ? '_parent' : undefined"
      :type="isTaskActive && taskUrl ? undefined : 'button'"
      @click="handleButtonClick"
    >
      {{ isTaskDisabled ? disabledButtonText : buttonText }}
    </component>

    <!-- Image shown only for disabled status -->
    <div v-if="isTaskDisabled" class="task-card__image">
      <img
        :src="disabledImage"
        alt=""
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        width="124"
        height="124"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
  .task-card {
    position: relative;
    display: flex;
    width: to-rem(288px);
    height: to-rem(240px);
    padding: to-rem(16px);
    flex-shrink: 0;
    flex-direction: column;
    gap: to-rem(8px);
    border-radius: to-rem(16px);
    box-shadow: 0 to-rem(8px) to-rem(16px) 0 rgb(0 10 18 / 20%);
    scroll-snap-align: start;

    @include mq(lg) {
      width: to-rem(320px);
      height: to-rem(272px);
      padding: to-rem(24px);
      gap: to-rem(16px);
    }

    &--active {
      background: var(--gradient-secondary);
    }

    &--disabled {
      background-color: var(--color-layer-alt-1);
    }

    &--finished {
      background: var(--color-layer-alt-1);
    }

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &__date {
      color: var(--color-text-primary);

      @include text(body, $weight: weight(bold), $lh: 1.25);
    }

    &__badge {
      display: flex;
      padding: to-rem(4px) to-rem(8px);
      align-items: center;
      gap: to-rem(4px);
      border-radius: to-rem(8px);
      background-color: rgb(0 10 18 / 20%);
      backdrop-filter: blur(5px);
    }

    &__badge-dot {
      $dot-size: to-rem(8px);

      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;
    }

    &__badge-text {
      color: var(--color-text-primary);
      white-space: nowrap;
      font-variant-numeric: tabular-nums; // stable width for timer digits

      @include text(tag);
    }

    &__badge--active {
      .task-card__badge-dot {
        background-color: var(--color-notif-successfully);
      }
    }

    &__badge--finished {
      .task-card__badge-dot {
        background-color: var(--color-notif-error);
      }
    }

    &__content {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: to-rem(16px);
      text-align: center;

      .task-card--disabled & {
        display: block;
      }
    }

    &__title {
      width: to-rem(256px);
      margin: 0;
      color: var(--color-text-primary);

      @include text(h3, $weight: weight(bold), $lh: lh(extra-tight));

      .task-card--disabled & {
        color: var(--color-text-secondary);
        text-align: center;
        text-transform: uppercase;

        @include text(tag, $size: to-rem(9px), $lh: 1.8, $track: to-rem(0.54px));
      }
    }

    &__description {
      width: to-rem(256px);
      color: var(--color-text-primary);

      @include text(body);

      :deep(strong) {
        font-weight: weight(bold);
      }

      .task-card--disabled & {
        color: var(--color-text-primary);
        text-align: center;
        text-transform: uppercase;

        @include text(body, $weight: weight(bold), $lh: 1.25);
      }
    }

    &__button {
      display: flex;
      width: 100%;
      min-height: to-rem(32px);
      padding: to-rem(8px) to-rem(16px);
      justify-content: center;
      align-items: center;
      border: none;
      border-radius: to-rem(30px);
      text-align: center;
      text-transform: uppercase;
      text-decoration: none;
      cursor: pointer;

      @include transition(all, sm, ease);
      @include text(button);

      @include mq(lg) {
        min-height: to-rem(40px);
        font-size: to-rem(size(sm));
        line-height: lh(extra-loose);
        letter-spacing: to-rem(0.84px);
      }

      .task-card--active & {
        background: var(--gradient-button-primary);
        color: var(--color-button-primary);
      }

      .task-card--disabled & {
        background-color: rgb(182 189 204 / 20%);
        color: var(--color-button-text-secondary);
      }

      .task-card--finished & {
        background-color: rgb(182 189 204 / 20%);
        color: var(--color-button-text-secondary);
      }

      &:hover {
        opacity: 0.9;
        transform: translateY(to-rem(-1px));
      }

      @media (prefers-reduced-motion: reduce) {
        transform: none;
        transition: none;
      }
    }

    &__image {
      position: absolute;
      top: 50%;
      left: 50%;
      display: flex;
      width: to-rem(124px);
      height: to-rem(124px);
      justify-content: center;
      align-items: center;
      transform: translate(-50%, -50%);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
</style>
