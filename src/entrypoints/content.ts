// Integrated - Vanilla
// More: https://wxt.dev/guide/content-script-ui.html
export default defineContentScript({
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      onMount: () => {
        // Run JavaScript
        // Get all elements that contain view count information
        function getElementsWithViews(): NodeListOf<Element> {
          return document.querySelectorAll('#metadata-line, .metadata-line')
        }

        // Extract the view count number
        function extractViewCount(text: string): null | number {
          const match = text.match(/(\d+(?:\.\d+)?[MK]?)\sviews/)
          if (!match) {
            return null
          }

          const countStr = match[1]
          let count
          if (countStr.endsWith('M')) {
            count = Number.parseFloat(countStr) * 1000000
          }
          else if (countStr.endsWith('K')) {
            count = Number.parseFloat(countStr) * 1000
          }
          else {
            count = Number.parseInt(countStr)
          }

          return count
        }

        // Find the corresponding video element
        function getRendererElement(viewElement: Element) {
          const renderer = viewElement.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer')
          return renderer
        }

        // Update element style using view count thresholds
        function updateElementStyle(element: HTMLElement, viewCount: number) {
          if (viewCount < 1000) {
            // Videos with fewer than 1000 views have a gray overlay
            element.style.opacity = '0.2'
            element.style.filter = 'none' // Remove highlight effect
          }
          else if (viewCount >= 1000 && viewCount < 100000) {
            // Videos with 1000 to 99999 views retain the default style
            element.style.opacity = '1'
            element.style.filter = 'none' // Remove highlight effect
          }
          else if (viewCount >= 100000 && viewCount < 500000) {
            // Videos with 100000 to 499999 views have a moderate green highlight effect
            element.style.opacity = '1'
            element.style.filter = 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
          }
          else if (viewCount >= 500000 && viewCount < 1000000) {
            // Videos with 500000 to 999999 views have an enhanced purple highlight effect
            element.style.opacity = '1'
            element.style.filter = 'drop-shadow(0 0 10px rgba(128, 0, 255, 0.6))'
          }
          else if (viewCount >= 1000000) {
            // Videos with 1000000 or more views have a gradient red highlight effect and animation
            element.style.opacity = '1'
            element.style.animation = 'glow 1.5s infinite alternate'
            element.style.filter = 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.5))'
          }
        }

        // Update element style using percentiles
        function updateElementStyleByPercentile(element: HTMLElement, percentile: number) {
          if (percentile <= 20) {
            element.style.opacity = '1'
            element.style.animation = 'glow 1.5s infinite alternate'
            element.style.filter = 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.5))'
          }
          else if (percentile <= 40) {
            element.style.opacity = '1'
            element.style.filter = 'drop-shadow(0 0 10px rgba(128, 0, 255, 0.6))'
          }
          else if (percentile <= 70) {
            element.style.opacity = '1'
            element.style.filter = 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
          }
          else if (percentile <= 85) {
            element.style.opacity = '1'
            element.style.filter = 'none'
          }
          else {
            element.style.opacity = '0.2'
            element.style.filter = 'none'
          }
        }

        // Add animation styles
        const style = document.createElement('style')
        style.innerHTML = `
@keyframes glow {
  from {
    filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.5));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.7)) drop-shadow(0 0 30px rgba(255, 165, 0, 0.7));
  }
}
`
        document.head.appendChild(style)

        // Initialize a set to keep track of processed elements
        const processedElements = new Set<Element>()

        // Run the update every second
        setInterval(() => {
          const elements = getElementsWithViews()
          const viewCounts: { el: Element, viewCount: number }[] = []

          elements.forEach((el) => {
            const viewText = el.textContent?.trim()
            if (viewText) {
              const viewCount = extractViewCount(viewText)

              if (viewCount !== null) {
                viewCounts.push({ el, viewCount })
              }
            }
          })

          const totalElements = viewCounts.length
          const orangeCount = viewCounts.filter(({ viewCount }) => viewCount >= 500000 && viewCount < 1000000).length
          const orangePercentage = (orangeCount / totalElements) * 100

          if (orangePercentage > 50) {
            // Use percentile-based styling
            viewCounts.sort((a, b) => b.viewCount - a.viewCount)
            viewCounts.forEach(({ el }, index) => {
              const renderer = getRendererElement(el)
              if (renderer) {
                const percentile = (index / (totalElements - 1)) * 100
                updateElementStyleByPercentile(renderer as HTMLElement, percentile)
                processedElements.add(renderer)
              }
            })
          }
          else {
            // Use view count-based styling
            viewCounts.forEach(({ el, viewCount }) => {
              const renderer = getRendererElement(el)
              if (renderer) {
                updateElementStyle(renderer as HTMLElement, viewCount)
                processedElements.add(renderer)
              }
            })

            // Check if no elements were processed for highlighting
            if (processedElements.size === 0 && totalElements > 0) {
              // Apply green effect to top 20% of videos
              viewCounts.sort((a, b) => b.viewCount - a.viewCount)
              const top20PercentCount = Math.ceil(totalElements * 0.2)
              viewCounts.slice(0, top20PercentCount).forEach(({ el }) => {
                const renderer = getRendererElement(el) as HTMLElement
                if (renderer) {
                  renderer.style.opacity = '1'
                  renderer.style.filter = 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.5))'
                  processedElements.add(renderer)
                }
              })
            }
          }

          // Clear the processed elements set for the next update
          processedElements.clear()
        }, 1000)
      },
      position: 'inline',
    })

    ui.mount()
  },

  matches: ['*://www.youtube.com/*'],
})
