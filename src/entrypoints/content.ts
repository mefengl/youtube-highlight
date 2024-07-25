// Integrated - Vanilla
// More: https://wxt.dev/guide/content-script-ui.html
export default defineContentScript({
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      onMount: () => {
        // Run JavaScript
        // Get all elements that contain view count information
        function getElementsWithViews(): NodeListOf<Element> {
          // eslint-disable-next-line no-console
          console.log('Fetching elements with views...')
          return document.querySelectorAll('#metadata-line, .metadata-line')
        }

        // Extract the view count number
        function extractViewCount(text: string): null | number {
          const match = text.match(/(\d+(?:\.\d+)?[MK]?)\sviews/)
          if (!match) {
            // eslint-disable-next-line no-console
            console.log(`No view count found in text: ${text}`)
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

          // eslint-disable-next-line no-console
          console.log(`Extracted view count: ${count} from text: ${text}`)
          return count
        }

        // Find the corresponding video element (supports ytd-rich-item-renderer, ytd-video-renderer, and ytd-compact-video-renderer)
        function getRendererElement(viewElement: Element): Element | null {
          const renderer = viewElement.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer')
          // eslint-disable-next-line no-console
          console.log(`Found renderer element: ${renderer}`)
          return renderer
        }

        // Update element style
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

          // eslint-disable-next-line no-console
          console.log(`Updated element style for view count: ${viewCount}`)
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
          // eslint-disable-next-line no-console
          console.log('Running update cycle...')
          const elements = getElementsWithViews()
          elements.forEach((el) => {
            const viewText = el.textContent?.trim()
            if (viewText) {
              const viewCount = extractViewCount(viewText)

              if (viewCount !== null) {
                const renderer = getRendererElement(el)
                if (renderer && !processedElements.has(renderer)) {
                  updateElementStyle(renderer, viewCount)
                  processedElements.add(renderer)
                  // eslint-disable-next-line no-console
                  console.log(`Processed renderer: ${renderer}`)
                }
              }
            }
          })
        }, 1000)

        // eslint-disable-next-line no-console
        console.log('Script initialized. Monitoring YouTube video views...')
      },
      position: 'inline',
    })

    ui.mount()
  },

  matches: ['<all_urls>'],
})
