import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Reactive media query matcher.
 * Returns a boolean ref that mirrors MediaQueryList.matches.
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mql: MediaQueryList | null = null

  /**
   * Updates the matches ref based on MediaQueryList event.
   * @param e - MediaQueryList event or list
   */
  const update = (e: MediaQueryList | MediaQueryListEvent) => {
    // Mirror current match state for both event and list
    matches.value = 'matches' in e ? e.matches : false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mql = window.matchMedia(query)
    matches.value = mql.matches

    // Support both modern and legacy listener APIs
    const list = mql as MediaQueryList
    if ('addEventListener' in list) list.addEventListener('change', update)
    else
      (
        list as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }
      ).addListener(update)
  })

  onUnmounted(() => {
    if (!mql) return
    const list = mql as MediaQueryList
    if ('removeEventListener' in list) list.removeEventListener('change', update)
    else
      (
        list as unknown as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }
      ).removeListener(update)
    mql = null
  })

  return matches
}
