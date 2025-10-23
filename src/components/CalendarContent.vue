<script setup lang="ts">
  /**
   * CalendarContent — main calendar interface with day picker and task cards.
   *
   * Key behaviors:
   * - Horizontal scrollable day picker with month grouping
   * - Auto-scroll to today's task on mount and day changes
   * - Responsive grid layout (mobile: horizontal, desktop: grid with placeholders)
   * - Terms modal integration with localized content
   *
   * Props: none (uses global app config)
   * Emits: day-click(CalendarDay), terms-click()
   * A11y: proper ARIA labels, keyboard navigation, focus management
   * Side effects: scroll listeners, resize handlers, RAF scheduling
   */
  // Vue imports
  import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'

  // Composables
  import { useMediaQuery } from '@/composables/useMediaQuery'
  import { useAppConfig } from '@/composables/useAppConfig'

  // Utilities
  import { getFirstDayOfWeekFromLang } from '@/utils/dateUtils'

  // Components
  import CalendarDays from './CalendarDays.vue'
  import TaskCard from './TaskCard.vue'
  import TermsModal from '@/components/TermsModal.vue'

  // Types
  import type { CalendarDay, TaskCard as TaskCardType, LocalizedText } from '@/types/app-config'

  // Constants
  const SCROLL_FORWARD_THRESHOLD = 0.7
  const SCROLL_BACKWARD_THRESHOLD = 0.7
  const SCROLL_ANIMATION_DURATION_MS = 320

  // Composables - single instance now
  const {
    currentLanguage,
    calendarData,
    calendarDays,
    getLocalizedText,
    ymd,
    parseYMD,
    currentDate,
    config,
    isToday,
  } = useAppConfig()
  const isWeekAlignMode = useMediaQuery('(min-width: 768px)')

  /**
   * Reactive "today" (YYYY-MM-DD) based on the current time mode.
   * Use the centralized currentDate from useAppConfig instead of local timer.
   */
  const todayYMD = computed(() => ymd(currentDate.value))

  /**
   * When "today" changes, flip statuses and scroll to the new active day/card.
   * This is the ONLY place where auto-scroll is performed after mount.
   */
  watch(todayYMD, async (newDay) => {
    // 1) Update day flags (active) in-place so UI reflects the new state
    for (const d of calendarDays.value) {
      d.isActive = isToday(d.date)
      // Optionally: also mark today's day as selected (UX: keep focus on "today")
      d.isSelected = d.date === newDay
    }

    // 2) Scroll to today's card and ensure the day is visible in the picker
    const today = calendarDays.value.find((d) => d.date === newDay) ?? calendarDays.value[0]
    if (!today) return
    await nextTick()
    scrollToTaskCard(today.date, { instant: false })
    scrollDayEnsureVisible(today.id)
  })

  // Template refs
  const tasksContainerRef = ref<HTMLElement>()
  const daysContainerRef = ref<HTMLElement>()

  // State and refs
  const currentMonthIndex = ref(0)
  const lastScrollLeft = ref(0)
  let rafId: number | null = null
  let isScheduled = false
  let monthElementsCache: HTMLElement[] | null = null
  const dayElementsCache = new Map<string, HTMLElement>()
  const cardElementsCache = new Map<string, HTMLElement>()

  /**
   * Scrolls days container to specified position with snap disabled.
   * @param left - Target scroll position
   * @param instant - Whether to use instant scroll (no animation)
   */
  function scrollWrapTo(left: number, instant = false) {
    const wrap = daysContainerRef.value
    if (!wrap) return
    const prev = wrap.style.scrollSnapType
    wrap.style.scrollSnapType = 'none'
    const max = wrap.scrollWidth - wrap.clientWidth
    const clamped = Math.max(0, Math.min(left, max))

    wrap.scrollTo({ left: clamped, behavior: instant ? 'auto' : 'smooth' })

    setTimeout(
      () => {
        wrap.style.scrollSnapType = prev || 'x mandatory'
      },
      instant ? 0 : SCROLL_ANIMATION_DURATION_MS,
    )
  }

  /**
   * Aligns specific day button to left/right/center of scroll container.
   * @param btn - Day button element to align
   * @param align - Alignment type
   * @param instant - Whether to use instant scroll (no animation)
   */
  function scrollDayElIntoView(
    btn: HTMLElement,
    align: 'left' | 'right' | 'center',
    instant = false,
  ) {
    const wrap = daysContainerRef.value
    if (!wrap || !btn) return

    const wrapRect = wrap.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()

    const padLeft = parseFloat(getComputedStyle(wrap).paddingLeft || '0')
    const padRight = parseFloat(getComputedStyle(wrap).paddingRight || '0')

    // x of left edge of button in wrap coordinate system considering current scrollLeft
    const btnLeftInWrap = wrap.scrollLeft + (btnRect.left - wrapRect.left)

    let targetLeft: number
    if (align === 'left') {
      targetLeft = btnLeftInWrap - padLeft
    } else if (align === 'right') {
      // pin with RIGHT edge without clipping
      const rightGap = wrap.clientWidth - btnRect.width - padRight
      targetLeft = btnLeftInWrap - rightGap
    } else {
      // align === 'center'
      targetLeft = btnLeftInWrap + btnRect.width / 2 - wrap.clientWidth / 2
    }

    scrollWrapTo(targetLeft, instant)
  }

  /**
   * Aligns day button to specified edge (left/right).
   * @param dayId - Day ID to align
   * @param align - Alignment type
   * @param opts - Scroll options
   */
  function scrollDayAlign(
    dayId: number | string,
    align: 'left' | 'right',
    opts?: { instant?: boolean },
  ) {
    const wrap = daysContainerRef.value
    if (!wrap) return
    const btn = wrap.querySelector<HTMLElement>(`[data-day-id="${dayId}"]`)
    if (!btn) return
    scrollDayElIntoView(btn, align, opts?.instant ?? false)
  }

  /**
   * Ensures day is fully visible without centering.
   * If already fully visible - no action.
   * If clipped left - align to left edge.
   * If clipped right - align to right edge.
   * @param dayId - Day ID to make visible
   * @param opts - Scroll options
   */
  function scrollDayEnsureVisible(dayId: number | string, opts?: { instant?: boolean }) {
    const wrap = daysContainerRef.value
    if (!wrap) return

    const btn = wrap.querySelector<HTMLElement>(`[data-day-id="${dayId}"]`)
    if (!btn) return

    const wrapRect = wrap.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()

    const padLeft = parseFloat(getComputedStyle(wrap).paddingLeft || '0')
    const padRight = parseFloat(getComputedStyle(wrap).paddingRight || '0')

    const fullyVisibleLeft = btnRect.left >= wrapRect.left + padLeft
    const fullyVisibleRight = btnRect.right <= wrapRect.right - padRight

    if (fullyVisibleLeft && fullyVisibleRight) return

    if (!fullyVisibleLeft) {
      scrollDayElIntoView(btn, 'left', opts?.instant ?? false)
      return
    }
    if (!fullyVisibleRight) {
      scrollDayElIntoView(btn, 'right', opts?.instant ?? false)
      return
    }
  }

  // Computed properties
  const title = computed(() => getLocalizedText(calendarData.value.title, currentLanguage.value))
  const description = computed(() =>
    getLocalizedText(calendarData.value.description, currentLanguage.value),
  )
  const promotionTag = computed(() =>
    getLocalizedText(calendarData.value.labels.promotion, currentLanguage.value),
  )
  const termsButtonText = computed(() =>
    getLocalizedText(calendarData.value.termsButton, currentLanguage.value),
  )

  /**
   * Terms & Conditions modal bindings sourced from configuration.
   * Kept local to this component; no cross-module side effects.
   */
  const showTerms = ref(false)
  const termsTitle = computed(() =>
    getLocalizedText(calendarData.value.termsModal.title, currentLanguage.value),
  )
  const termsHtml = computed(() =>
    getLocalizedText(calendarData.value.termsModal.html, currentLanguage.value),
  )
  const closeAria = computed(() =>
    getLocalizedText(calendarData.value.termsModal.closeAriaLabel, currentLanguage.value),
  )

  const groupedDays = computed(() => {
    const configValue = config.value
    const align: boolean = !!(configValue.alignByWeekday && isWeekAlignMode.value)

    const fdowCfg: 'auto' | 'monday' | 'sunday' =
      'firstDayOfWeek' in configValue &&
      ['auto', 'monday', 'sunday'].includes(configValue.firstDayOfWeek as string)
        ? (configValue.firstDayOfWeek as 'auto' | 'monday' | 'sunday')
        : 'auto'
    const fdow = getFirstDayOfWeekFromLang(currentLanguage.value, fdowCfg)

    const byMonth = new Map<string, CalendarDay[]>()
    calendarDays.value.forEach((d) => {
      const dt = parseYMD(d.date)
      const key = `${dt.getFullYear()}-${dt.getMonth()}`
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key)!.push(d)
    })

    const result: Array<{ month: string; days: CalendarDay[] }> = []

    for (const [, days] of byMonth.entries()) {
      const sample = parseYMD(days[0]!.date)
      const year = sample.getFullYear()
      const monthIndex = sample.getMonth()
      const monthLabel = sample.toLocaleDateString(currentLanguage.value, { month: 'long' })

      if (!align) {
        result.push({ month: monthLabel, days })
        continue
      }

      // Build grid only for the actual date range, not the entire month
      const startDate = parseYMD(days[0]!.date)

      // Create placeholders only for the start of our range
      const firstDayOfWeek = startDate.getDay()
      const offset = (firstDayOfWeek - fdow + 7) % 7

      const grid: CalendarDay[] = []

      // Add placeholders at the start
      for (let i = 0; i < offset; i++) {
        grid.push({
          id: `ph-${year}-${monthIndex}-${i}`,
          day: 0,
          date: '',
          isActive: false,
          isSelected: false,
          isToday: false,
          hasTask: false,
          isPlaceholder: true,
        })
      }

      // Add actual days
      grid.push(...days)

      result.push({ month: monthLabel, days: grid })
    }

    return result
  })

  /**
   * Formats date string to localized text format.
   * @param dateString - Date in YYYY-MM-DD format
   * @param language - Language code for formatting
   * @returns Localized text object with date in "Month, Day" format
   */
  function formatDate(dateString: string, language: string = 'en'): LocalizedText {
    const date = parseYMD(dateString)
    const month = date.toLocaleDateString(language, { month: 'long' })
    const day = date.getDate()
    const formattedDate = `${month}, ${day}`

    return {
      en: formattedDate,
      de: formattedDate,
      fr: formattedDate,
      it: formattedDate,
      es: formattedDate,
      pt: formattedDate,
    }
  }

  /**
   * Initialize element cache for quick access by date.
   * Clears previous cache and populates day and card element maps.
   */
  function initializeElementCaches() {
    dayElementsCache.clear()
    cardElementsCache.clear()

    if (daysContainerRef.value) {
      daysContainerRef.value.querySelectorAll<HTMLElement>('[data-date]').forEach((el) => {
        const date = el.dataset.date
        if (date) {
          dayElementsCache.set(date, el)
        }
      })
    }

    if (tasksContainerRef.value) {
      tasksContainerRef.value.querySelectorAll<HTMLElement>('[data-date]').forEach((el) => {
        const date = el.dataset.date
        if (date) {
          cardElementsCache.set(date, el)
        }
      })
    }
  }

  /**
   * Handles day selection and scrolling to corresponding task.
   * @param day - Selected calendar day
   */
  function handleDayClick(day: CalendarDay) {
    calendarDays.value.forEach((d) => (d.isSelected = false))
    day.isSelected = true

    scrollToTaskCard(day.date)
    scrollDayEnsureVisible(day.id)
  }

  /**
   * Handles task card clicks for inactive tasks.
   * Redirects to today's task and scrolls to it.
   * @param task - Clicked task card
   */
  function handleTaskClick(task: TaskCardType) {
    if (!task.isActive) {
      const todayStr = ymd(new Date())
      const today = calendarDays.value.find((d) => d.date === todayStr) ?? calendarDays.value[0]
      if (today) {
        calendarDays.value.forEach((d) => (d.isSelected = false))
        today.isSelected = true
        scrollToTaskCard(today.date)
        scrollDayEnsureVisible(today.id)
      }
      return
    }
  }

  /**
   * Handles terms and conditions button click.
   */
  function handleTermsClick() {
    showTerms.value = true
  }

  /**
   * Handles window resize events.
   * Recalculates element caches and scroll positions.
   */
  function handleResize() {
    // Rebuild caches only; do NOT auto-scroll here.
    monthElementsCache = null
    initializeElementCaches()
  }

  /**
   * Gets task for specific day with cyclic fallback.
   * If day is disabled or not found, returns disabled task placeholder.
   * @param day - Calendar day to get task for
   * @returns Task object or disabled task placeholder
   */
  function getTaskForDay(day: CalendarDay) {
    const dayIndex = calendarDays.value.findIndex((d) => d.id === day.id)

    if (dayIndex === -1) {
      return {
        id: `placeholder-${day.id}`,
        isActive: false,
        title: calendarData.value.disabledTask.title,
        description: formatDate(day.date, currentLanguage.value),
        buttonText: calendarData.value.disabledTask.buttonText,
        image: calendarData.value.disabledTask.image,
      }
    }

    const tasks = calendarData.value.tasks
    const taskIndex = dayIndex % tasks.length
    const task = tasks[taskIndex]

    if (task) {
      return task
    }

    return {
      id: `placeholder-${day.id}`,
      isActive: false,
      title: calendarData.value.disabledTask.title,
      description: formatDate(day.date, currentLanguage.value),
      buttonText: calendarData.value.disabledTask.buttonText,
      image: calendarData.value.disabledTask.image,
    }
  }

  /**
   * Scrolls to task card by date.
   * @param date - Date string in YYYY-MM-DD format
   * @param opts - Scroll options
   */
  function scrollToTaskCard(date: string, opts?: { instant?: boolean }) {
    const container = tasksContainerRef.value
    if (!container) return

    let card = cardElementsCache.get(date)
    if (!card) {
      const foundCard = container.querySelector<HTMLElement>(`[data-date="${date}"]`)
      if (foundCard) {
        card = foundCard
        cardElementsCache.set(date, card)
      }
    }

    if (!card) return

    const target = card.offsetLeft
    container.scrollTo({
      left: Math.max(0, target),
      behavior: opts?.instant ? 'auto' : 'smooth',
    })
  }

  /**
   * Updates current month based on scroll position with hysteresis.
   * Uses symmetric thresholds to prevent flicker during momentum scroll.
   */
  function updateCurrentMonth() {
    if (!daysContainerRef.value) return

    const container = daysContainerRef.value
    const containerRect = container.getBoundingClientRect()
    const currentScrollLeft = container.scrollLeft

    const FORWARD_THRESHOLD = container.clientWidth * SCROLL_FORWARD_THRESHOLD
    const BACKWARD_THRESHOLD = container.clientWidth * SCROLL_BACKWARD_THRESHOLD

    if (!monthElementsCache) {
      monthElementsCache = Array.from(
        container.querySelectorAll<HTMLElement>('.calendar-picker__month-group'),
      )
    }

    const isScrollingForward = currentScrollLeft > (lastScrollLeft.value || 0)
    lastScrollLeft.value = currentScrollLeft

    const threshold = isScrollingForward ? FORWARD_THRESHOLD : BACKWARD_THRESHOLD

    const activeIndex = monthElementsCache.findIndex((element) => {
      const elementRect = element.getBoundingClientRect()
      const visibleLeft = Math.max(elementRect.left, containerRect.left)
      const visibleRight = Math.min(elementRect.right, containerRect.right)

      if (visibleLeft < visibleRight) {
        const visibleWidth = visibleRight - visibleLeft
        return visibleWidth >= threshold
      }

      return false
    })

    if (activeIndex !== -1) {
      currentMonthIndex.value = activeIndex
    }
  }

  /**
   * Schedules month update using RAF to avoid excessive calls.
   * Prevents multiple updates during continuous scrolling.
   */
  function scheduleUpdateMonth() {
    if (isScheduled) return
    isScheduled = true
    rafId = requestAnimationFrame(() => {
      updateCurrentMonth()
      isScheduled = false
      rafId = null
    })
  }

  /**
   * Watches for changes in grouped days, language, or alignment mode.
   * Invalidates month elements cache and reinitializes element caches.
   */
  watch([groupedDays, currentLanguage, isWeekAlignMode], () => {
    monthElementsCache = null
    nextTick(() => {
      initializeElementCaches()
    })
  })

  /**
   * Component mounted lifecycle hook.
   * Sets up scroll listeners, initializes caches, and positions to today's date.
   */
  onMounted(async () => {
    if (daysContainerRef.value) {
      daysContainerRef.value.addEventListener('scroll', scheduleUpdateMonth, { passive: true })
    }

    await nextTick()
    await new Promise((r) => requestAnimationFrame(r))

    initializeElementCaches()

    const todayString = ymd(new Date())
    const todayDay = calendarDays.value.find((d) => d.date === todayString) ?? calendarDays.value[0]
    if (todayDay) {
      calendarDays.value.forEach((d) => (d.isSelected = false))
      todayDay.isSelected = true
      scrollToTaskCard(todayDay.date, { instant: true })
      scrollDayAlign(todayDay.id, 'left', { instant: true })
    }

    window.addEventListener('resize', handleResize)
  })

  /**
   * Component unmounted lifecycle hook.
   * Cleans up RAF, scroll listeners, and window resize handler.
   */
  onUnmounted(() => {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (daysContainerRef.value) {
      daysContainerRef.value.removeEventListener('scroll', scheduleUpdateMonth)
    }
    window.removeEventListener('resize', handleResize)
  })
</script>

<template>
  <section class="calendar" aria-labelledby="calendar-title">
    <div class="calendar__inner">
      <header v-if="config.ui.introSection.visible" class="calendar__header">
        <div v-if="config.ui.introSection.tagLabel" class="calendar__labels">
          <div class="calendar__tag calendar__tag--promotion">{{ promotionTag }}</div>
        </div>
        <h1 v-if="config.ui.introSection.title" id="calendar-title" class="calendar__title">
          {{ title }}
        </h1>
        <p v-if="config.ui.introSection.description" class="calendar__description">
          {{ description }}
        </p>
      </header>

      <nav
        v-if="config.ui.calendarSection.visible"
        class="calendar-picker"
        aria-label="Choose date"
      >
        <div class="calendar-picker__months">
          <h3 class="calendar-picker__month-title">
            {{ groupedDays[currentMonthIndex]?.month || '' }}
          </h3>
        </div>

        <div ref="daysContainerRef" class="calendar-picker__days">
          <div
            v-for="group in groupedDays"
            :key="`days-${group.month}`"
            class="calendar-picker__month-group"
            :data-month="group.month"
          >
            <h3 class="calendar-picker__month-title sr-only">{{ group.month }}</h3>
            <CalendarDays :month="group.month" :days="group.days" @day-click="handleDayClick" />
          </div>
        </div>
      </nav>

      <section v-if="config.ui.calendarSection.tasksPanel" class="calendar__tasks-panel">
        <ol ref="tasksContainerRef" class="calendar__tasks-list">
          <li v-for="(day, index) in calendarDays" :key="day.id">
            <TaskCard
              :task="getTaskForDay(day)"
              :task-index="index"
              :language="currentLanguage"
              @button-click="handleTaskClick"
            />
          </li>
        </ol>
      </section>

      <footer v-if="config.ui.footerSection.visible" class="calendar__footer">
        <button
          v-if="config.ui.footerSection.termsButton"
          class="calendar__footer-button"
          type="button"
          @click="handleTermsClick"
        >
          {{ termsButtonText }}
        </button>
      </footer>
      <TermsModal
        v-if="config.ui.footerSection.termsModal.visible"
        v-model="showTerms"
        :title="termsTitle"
        :html="termsHtml"
        :close-aria-label="closeAria"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
  .calendar {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: to-rem(16px);
    border-radius: to-rem(16px) to-rem(16px) 0 0;
    background-color: var(--color-layer-1);
    margin-bottom: to-rem(32px);
    margin-top: to-rem(-32px);

    @include mq(lg) {
      padding: to-rem(32px);
      border-radius: 0;
      margin-bottom: 0;
      margin-top: 0;
    }

    &__inner {
      display: flex;
      flex-direction: column;
      gap: to-rem(24px);

      @include mq(lg) {
        display: grid;
        display: flex;
        max-width: to-rem(980px);
        margin: 0 auto;
        justify-content: center;
        gap: to-rem(32px);
        flex-flow: row wrap;
      }

      @include mq(xl) {
        gap: to-rem(32px) to-rem(64px);
      }
    }

    &__header {
      display: flex;
      width: 100%;
      flex-direction: column;
      gap: to-rem(16px);

      @include mq(lg) {
        gap: to-rem(20px);
        grid-column: 1 / -1;
      }
    }

    &__labels {
      display: flex;
      justify-content: center;
      gap: to-rem(8px);
    }

    &__tag {
      height: to-rem(24px);
      padding: to-rem(4px) to-rem(16px);
      border-radius: to-rem(8px);
      backdrop-filter: blur(5px);
      text-align: center;
      white-space: nowrap;

      @include text(tag);

      &--promotion {
        background-color: rgb(182 189 204 / 20%);
        color: var(--color-text-primary);
      }
    }

    &__title {
      color: var(--color-text-menu-active);
      text-align: center;
      text-transform: uppercase;

      @include text(h1, $lh: lh(relaxed));
    }

    &__description {
      width: 100%;
      margin: 0;
      color: var(--color-text-secondary);

      @include text(body);
    }

    &__tasks-panel {
      @include mq(lg) {
        position: relative;
        display: flex;
        width: 100%;
        max-width: to-rem(368px);
        justify-content: center;
        order: 1;
        place-self: center;

        &::before,
        &::after {
          position: absolute;
          top: 50%;
          z-index: -1;
          width: to-rem(288px);
          height: to-rem(240px);
          border-radius: to-rem(12px);
          box-shadow: 0 8px 16px 0 rgb(0 10 18 / 20%);
          background: rgb(182 189 204 / 10%);
          transform: translateY(-50%);
          pointer-events: none;
          content: '';
        }

        &::before {
          left: 0;
          width: to-rem(24px);
          border-radius: to-rem(12px) 0 0 to-rem(12px);
        }

        &::after {
          right: 0;
          width: to-rem(344px);
          border-radius: 0 to-rem(12px) to-rem(12px) 0;
        }
      }
    }

    &__tasks-list {
      display: flex;
      overflow-x: auto;
      padding: 0;
      gap: to-rem(16px);
      list-style: none;
      -ms-overflow-style: none;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      @include mq(lg) {
        max-width: to-rem(320px);
        border-radius: to-rem(16px);
      }
    }

    &__footer {
      display: flex;
      justify-content: center;

      @include mq(lg) {
        width: 100%;
        order: 3;
      }
    }

    &__footer-button {
      display: flex;
      width: 100%;
      max-width: to-rem(328px);
      min-height: to-rem(32px);
      padding: to-rem(8px) to-rem(16px);
      justify-content: center;
      align-items: center;
      border: none;
      border-radius: to-rem(30px);
      background-color: rgb(182 189 204 / 20%);
      color: var(--color-button-text-secondary);
      text-align: center;
      text-transform: uppercase;
      text-decoration: none;
      cursor: pointer;

      @include transition(all, sm, ease);
      @include text-button;

      @include mq(lg) {
        min-height: to-rem(40px);
        font-size: to-rem(size(sm));
        line-height: lh(extra-loose);
        letter-spacing: to-rem(0.84px);
      }

      &:hover {
        background-color: rgb(182 189 204 / 30%);
      }

      // Disable animations for users with reduced motion preference
      @media (prefers-reduced-motion: reduce) {
        transform: none;
        transition: none;
      }
    }
  }

  .calendar-picker {
    display: flex;
    flex-direction: column;
    gap: to-rem(16px);

    @include mq(lg) {
      gap: to-rem(20px);
      grid-column: 2;
      grid-row: 2;
      order: 2;
    }

    &__months {
      position: relative;
      display: flex;
      justify-content: center;

      @include mq(lg) {
        display: none;
      }
    }

    &__month-title {
      color: var(--color-text-primary);

      @include text(h3, $weight: weight(bold));
    }

    &__days {
      display: flex;
      overflow-x: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      @include mq(lg) {
        overflow-x: visible;
        flex-direction: column;
        gap: to-rem(32px);
      }
    }

    &__month-group {
      position: relative;
      display: flex;
      min-width: 100%;
      flex-shrink: 0;
      justify-content: center;
      align-items: center;

      &:last-of-type :deep(.calendar-days__container) {
        padding-inline-end: 0;
      }

      @include mq(lg) {
        min-width: auto;
        flex-shrink: 1;
        flex-direction: column;
        gap: to-rem(24px);

        &::before {
          display: block;
          color: var(--color-text-primary);
          content: attr(data-month);

          @include text(h3, $weight: weight(bold));
        }
      }
    }
  }
</style>
