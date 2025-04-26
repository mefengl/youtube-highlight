/* eslint-disable no-console */
// Integrated - Optimized with MutationObserver (no polling)
export default defineContentScript({
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      onMount: () => {
        // ------------------------------------------------------------
        // Inject tier‑based CSS classes (single injection per page)
        // ------------------------------------------------------------
        const style = document.createElement('style')
        style.textContent = `
@keyframes vh-glow {
  from { filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.5)); }
  to   { filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.7)) drop-shadow(0 0 30px rgba(255, 165, 0, 0.7)); }
}
.vh-low      { opacity: 0.2 !important; filter: none !important; }
.vh-normal   { opacity: 1 !important;  filter: none !important; }
.vh-green    { opacity: 1 !important;  filter: drop-shadow(0 0 8px rgba(0, 255, 0, 0.5)) !important; }
.vh-purple   { opacity: 1 !important;  filter: drop-shadow(0 0 10px rgba(128, 0, 255, 0.6)) !important; }
.vh-red      { opacity: 1 !important;  animation: vh-glow 1.5s infinite alternate; filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.5)) !important; }
`
        document.head.appendChild(style)

        // ------------------------------------------------------------
        // Helper structures
        // ------------------------------------------------------------
        // Track if a #metadata-line element has been processed
        const processed = new WeakSet<Element>()

        // Track view counts by element (cache)
        const viewCache = new WeakMap<Element, number>()

        // Track all renderers (optional — can be used for analytics)
        const allViewData: { renderer: HTMLElement; viewCount: number }[] = []

        // ------------------------------------------------------------
        // Utilities
        // ------------------------------------------------------------
        function extractViewCount(text: string): null | number {
          // Support "1.2M views" and "2,345 次观看"
          const match = text.match(/([\d,.]+)(?:\s*(?:[MK]))?\s*(?:views|次观看)/i)
          if (!match) return null

          let numStr = match[1].replace(/,/g, '')
          if (text.includes('M')) return parseFloat(numStr) * 1_000_000
          if (text.includes('K')) return parseFloat(numStr) * 1_000
          return parseFloat(numStr)
        }

        function tierClass(viewCount: number): string {
          if (viewCount < 1_000) return 'vh-low'
          if (viewCount < 100_000) return 'vh-normal'
          if (viewCount < 500_000) return 'vh-green'
          if (viewCount < 1_000_000) return 'vh-purple'
          return 'vh-red'
        }

        function applyTier(renderer: HTMLElement, viewCount: number) {
          const cls = tierClass(viewCount)
          renderer.classList.remove('vh-low', 'vh-normal', 'vh-green', 'vh-purple', 'vh-red')
          renderer.classList.add(cls)
        }

        function handleMetadataElement(el: Element) {
          if (processed.has(el)) return
          processed.add(el)

          const txt = el.textContent?.trim() || ''
          const count = extractViewCount(txt)
          if (count == null) return

          viewCache.set(el, count)

          const renderer = el.closest<HTMLElement>(
            'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer',
          )
          if (!renderer) return

          allViewData.push({ renderer, viewCount: count })
          applyTier(renderer, count)
        }

        // ------------------------------------------------------------
        // Initial scan (above‑the‑fold)
        // ------------------------------------------------------------
        document.querySelectorAll('#metadata-line, .metadata-line').forEach(handleMetadataElement)

        // ------------------------------------------------------------
        // Observe new nodes for dynamic / infinite scroll
        // ------------------------------------------------------------
        const mo = new MutationObserver((records) => {
          for (const record of records) {
            record.addedNodes.forEach((node) => {
              if (!(node instanceof Element)) return

              // If the node itself is a metadata‑line
              if (node.matches?.('#metadata-line, .metadata-line')) handleMetadataElement(node)

              // Or it may contain metadata‑lines deeper
              node.querySelectorAll?.('#metadata-line, .metadata-line').forEach(handleMetadataElement)
            })
          }
        })
        mo.observe(document.body, { childList: true, subtree: true })

        // ------------------------------------------------------------
        // Pause observer when tab is hidden to save CPU
        // ------------------------------------------------------------
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) mo.disconnect()
          else mo.observe(document.body, { childList: true, subtree: true })
        })
      },
      position: 'inline',
    })

    ui.mount()
  },

  matches: ['*://www.youtube.com/*'],
})
