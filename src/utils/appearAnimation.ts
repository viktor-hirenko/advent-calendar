/**
 * Appear animation of the page blocks (styles: src/assets/scss/layouts/appear.scss).
 *
 * <html data-appear> goes through three states:
 * - "wait": the blocks are hidden until the hero picture has loaded, at most MAX_WAIT_MS;
 * - "run": the blocks appear one after another, once;
 * - "done": the animation is over, the blocks are left as they are.
 * Nothing happens when the user prefers reduced motion.
 */

/** Longest wait for the hero picture before the blocks appear anyway. */
const MAX_WAIT_MS = 1000

/** Delay plus duration of the last block (320ms + 420ms), with a margin. */
const ANIMATION_TOTAL_MS = 800

/**
 * Hides the blocks before the app is mounted, so they never flash in their final place.
 * @returns Whether the animation will run
 */
export function prepareAppearAnimation(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  document.documentElement.dataset.appear = 'wait'
  return true
}

/**
 * Starts the animation when the hero picture has loaded (or failed, or after MAX_WAIT_MS).
 * Waits two frames first, so the first scroll to today's card is already done.
 */
export function runAppearAnimationWhenReady(): void {
  const root = document.documentElement
  let started = false

  const start = () => {
    if (started) return
    started = true
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        root.dataset.appear = 'run'
        window.setTimeout(() => {
          root.dataset.appear = 'done'
        }, ANIMATION_TOTAL_MS)
      }),
    )
  }

  const hero = document.querySelector<HTMLImageElement>('[role="banner"] img')
  if (!hero || hero.complete) {
    start()
  } else {
    hero.addEventListener('load', start, { once: true })
    hero.addEventListener('error', start, { once: true })
  }
  window.setTimeout(start, MAX_WAIT_MS)
}
