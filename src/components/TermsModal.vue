<script setup lang="ts">
  /**
   * Accessible Terms & Conditions modal.
   * - Controlled via v-model (modelValue)
   * - Closes on background click and ESC key
   * - Uses role="dialog" and aria-modal for screen readers
   * - Teleported to body to avoid z-index issues
   * - Locks body scroll when open
   */
  import { onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

  interface Props {
    modelValue: boolean
    title: string
    html: string
    closeAriaLabel: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

  // Focus management
  const dialogRef = ref<HTMLElement>()
  const closeButtonRef = ref<HTMLButtonElement>()
  let previousActiveElement: HTMLElement | null = null

  function close() {
    emit('update:modelValue', false)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close()
      return
    }

    // Simple focus trap - cycle Tab between dialog and close button
    if (e.key === 'Tab' && dialogRef.value) {
      const focusableElements = [dialogRef.value, closeButtonRef.value].filter(Boolean)
      if (focusableElements.length < 2) return

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

      if (e.shiftKey) {
        // Shift+Tab - go to previous element
        if (currentIndex <= 0) {
          e.preventDefault()
          focusableElements[focusableElements.length - 1]?.focus()
        }
      } else {
        // Tab - go to next element
        if (currentIndex >= focusableElements.length - 1) {
          e.preventDefault()
          focusableElements[0]?.focus()
        }
      }
    }
  }

  /**
   * Toggles scroll lock class on document element.
   * Uses CSS class instead of inline styles for better maintainability.
   * @param lock - Whether to apply scroll lock
   */
  function toggleScrollLock(lock: boolean) {
    if (lock) {
      document.documentElement.classList.add('scroll-lock')
    } else {
      document.documentElement.classList.remove('scroll-lock')
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKey)
    watch(
      () => props.modelValue,
      async (val) => {
        toggleScrollLock(val)
        if (val) {
          // Store previous active element
          previousActiveElement = document.activeElement as HTMLElement
          // Focus on dialog or close button when opening
          await nextTick()
          if (closeButtonRef.value) {
            closeButtonRef.value.focus()
          } else if (dialogRef.value) {
            dialogRef.value.focus()
          }
        } else {
          // Return focus to previous element when closing
          if (previousActiveElement) {
            previousActiveElement.focus()
            previousActiveElement = null
          }
        }
      },
      { immediate: true },
    )
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    toggleScrollLock(false)
  })
</script>

<template>
  <teleport to="body">
    <transition name="modal" appear>
      <div v-if="modelValue" class="popup" @click.self="close">
        <div
          ref="dialogRef"
          class="popup__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title"
          aria-describedby="terms-content"
          tabindex="-1"
        >
          <header class="popup__header">
            <h2 id="terms-title">{{ title }}</h2>
            <button
              ref="closeButtonRef"
              class="popup__close"
              type="button"
              :aria-label="closeAriaLabel"
              @click="close"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.6451 4.36708C19.1718 3.89382 18.4073 3.89382 17.934 4.36708L12 10.289L6.06598 4.35495C5.59272 3.88168 4.82821 3.88168 4.35495 4.35495C3.88168 4.82821 3.88168 5.59272 4.35495 6.06598L10.289 12L4.35495 17.934C3.88168 18.4073 3.88168 19.1718 4.35495 19.6451C4.82821 20.1183 5.59272 20.1183 6.06598 19.6451L12 13.711L17.934 19.6451C18.4073 20.1183 19.1718 20.1183 19.6451 19.6451C20.1183 19.1718 20.1183 18.4073 19.6451 17.934L13.711 12L19.6451 6.06598C20.1062 5.60485 20.1062 4.82821 19.6451 4.36708Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </header>
          <!-- NOTE: content is trusted (from config); sanitize if externalized -->
          <div id="terms-content" class="popup__content" v-html="html"></div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
  .popup {
    position: fixed;
    inset: 0;
    z-index: 8;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(0 0 0 / 60%);

    &__dialog {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      background: var(--color-layer-alt-1);
      color: var(--color-text-primary);

      @include mq(lg) {
        width: to-rem(500px);
        max-height: to-rem(800px);
        border-radius: 30px;
      }
    }

    &__header {
      position: absolute;
      left: 50%;
      width: 90%;
      transform: translate(-50%);
      margin-top: to-rem(50px);

      h2 {
        margin: 0;
        color: var(--color-text-primary);
        text-align: center;

        @include text(h3, $weight: weight(bold));
      }
    }

    &__close {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      width: to-rem(24px);
      height: to-rem(24px);
      padding: 0;
      justify-content: center;
      align-items: center;
      border: none;
      background: transparent;
      color: var(--color-text-primary);
      cursor: pointer;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    &__content {
      position: absolute;
      top: to-rem(50px);
      left: 5%;
      overflow: hidden auto;
      width: 90%;
      height: 85%;
      color: var(--color-text-primary);

      @include text(body);

      text-align: left;
      margin-top: to-rem(50px);

      :deep(ol) {
        margin: 0;
        padding-left: to-rem(20px);

        li {
          margin: 0 0 to-rem(20px);
          color: var(--color-text-primary);

          @include text(body);

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  // Modal transition animations
  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active .popup__dialog,
  .modal-leave-active .popup__dialog {
    transition: all 0.3s ease;
  }

  .modal-enter-from .popup__dialog,
  .modal-leave-to .popup__dialog {
    transform: scale(0.8);
    opacity: 0;
  }
</style>
