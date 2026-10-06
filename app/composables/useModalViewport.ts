/** Keep teleported dialogs inside the area above the mobile keyboard. */
export function useModalViewport() {
  onMounted(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        root.style.setProperty('--modal-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
        root.style.setProperty('--modal-viewport-top', `${viewport?.offsetTop ?? 0}px`)
        const field = document.activeElement
        if (!(field instanceof HTMLElement)) return
        const body = field.closest<HTMLElement>('.viewport-modal [data-slot="body"]')
        if (!body) return
        const bounds = body.getBoundingClientRect()
        const input = field.getBoundingClientRect()
        // Scroll only the form, not the page behind the dialog.
        if (input.bottom > bounds.bottom - 12) body.scrollTop += input.bottom - bounds.bottom + 12
        else if (input.top < bounds.top + 12) body.scrollTop += input.top - bounds.top - 12
      })
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    document.addEventListener('focusin', update)
    onBeforeUnmount(() => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.removeEventListener('focusin', update)
      root.style.removeProperty('--modal-viewport-height')
      root.style.removeProperty('--modal-viewport-top')
    })
  })
}
