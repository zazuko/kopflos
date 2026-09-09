import { expect } from '@open-wc/testing'
import '../../runtime/open-styles.js'

describe('open-styles performance', () => {
  let styleEl: HTMLStyleElement

  before(() => {
    styleEl = document.createElement('style')
    styleEl.textContent = `
      .perf-box {
        color: rgb(0, 100, 200);
        margin: 4px;
        padding: 2px;
      }
      .perf-highlight {
        background-color: yellow;
      }
    `
    document.head.appendChild(styleEl)
  })

  after(() => {
    styleEl.remove()
  })

  it('efficiently renders and applies styles to thousands of elements', async function () {
    this.timeout(30000)

    const ELEMENT_COUNT = 3000
    const container = document.createElement('div')
    document.body.appendChild(container)

    class PerfElement extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="perf-box">Item</div>
        `
      }
    }

    const tag = `perf-element-${Date.now()}`
    customElements.define(tag, PerfElement)

    const startTime = performance.now()

    // Create fragment with thousands of elements
    const fragment = document.createDocumentFragment()
    const elements: PerfElement[] = []

    for (let i = 0; i < ELEMENT_COUNT; i++) {
      const el = document.createElement(tag) as PerfElement
      elements.push(el)
      fragment.appendChild(el)
    }

    container.appendChild(fragment)

    // Wait until all elements have processed open-styles
    const maxWaitTime = 15000
    const startWait = performance.now()
    while (performance.now() - startWait < maxWaitTime) {
      const allDone = elements.every(el => el.shadowRoot!.adoptedStyleSheets.length > 0)
      if (allDone) break
      await new Promise(resolve => setTimeout(resolve, 20))
    }

    const endTime = performance.now()
    const totalDuration = endTime - startTime
    const avgPerElement = totalDuration / ELEMENT_COUNT
    const opsPerSec = Math.round((ELEMENT_COUNT / totalDuration) * 1000)

    // Verify correctness for all elements
    const firstAdoptedSheet = elements[0].shadowRoot!.adoptedStyleSheets[0]
    expect(firstAdoptedSheet, 'First element should have adopted stylesheet').to.not.be.undefined

    for (let i = 0; i < ELEMENT_COUNT; i++) {
      const shadow = elements[i].shadowRoot!
      expect(shadow.adoptedStyleSheets.length).to.be.greaterThan(0)
      // Verify stylesheet reference is shared (reused from cache, not recreated)
      expect(shadow.adoptedStyleSheets[0]).to.equal(firstAdoptedSheet)
      // Verify <open-styles> cleaned itself up
      expect(shadow.querySelector('open-styles')).to.be.null
    }

    // Verify computed style on a sample of elements
    const sampleIndices = [0, Math.floor(ELEMENT_COUNT / 2), ELEMENT_COUNT - 1]
    for (const idx of sampleIndices) {
      const box = elements[idx].shadowRoot!.querySelector('.perf-box') as HTMLElement
      const color = window.getComputedStyle(box).color
      expect(color).to.equal('rgb(0, 100, 200)')
    }

    // Output performance metrics
    // eslint-disable-next-line no-console
    console.log(
      `[Performance Result] Processed ${ELEMENT_COUNT} elements in ${totalDuration.toFixed(2)}ms `
      + `(${avgPerElement.toFixed(3)}ms/elem, ~${opsPerSec} elem/s)`,
    )

    // Performance assertion: should complete comfortably within reasonable threshold (< 2ms per element)
    expect(avgPerElement).to.be.lessThan(2.0)

    // Cleanup
    container.remove()
  })
})
