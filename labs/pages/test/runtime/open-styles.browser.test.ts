import { expect, fixture } from '@open-wc/testing'
import { getOpenStyles, whenDOMReady } from '../../runtime/open-styles.js'

describe('open-styles element', () => {
  let styleEl: HTMLStyleElement

  beforeEach(() => {
    styleEl = document.createElement('style')
    styleEl.textContent = `
      .test-target {
        color: rgb(255, 0, 0);
        display: block;
      }
      .custom-rule {
        background-color: rgb(0, 128, 0);
      }
    `
    document.head.appendChild(styleEl)
  })

  afterEach(() => {
    styleEl.remove()
  })

  it('defines custom element', () => {
    expect(customElements.get('open-styles')).to.not.be.undefined
  })

  it('adopts document stylesheets into a shadow root', async () => {
    class TestShadowEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="test-target">Styled text</div>
        `
      }
    }

    const tag = `test-shadow-${Date.now()}`
    customElements.define(tag, TestShadowEl)

    const el = await fixture<TestShadowEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    const target = el.shadowRoot!.querySelector('.test-target') as HTMLElement
    const computed = window.getComputedStyle(target)

    expect(computed.color).to.equal('rgb(255, 0, 0)')
    expect(el.shadowRoot!.adoptedStyleSheets.length).to.be.greaterThan(0)
    // <open-styles> should remove itself after applying styles
    expect(el.shadowRoot!.querySelector('open-styles')).to.be.null
  })

  it('adopts constructable document.adoptedStyleSheets into shadow root', async () => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync('.adopted-target { font-weight: 700; }')
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]

    class AdoptedEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <span class="adopted-target">Bold</span>
        `
      }
    }

    const tag = `test-adopted-${Date.now()}`
    customElements.define(tag, AdoptedEl)

    const el = await fixture<AdoptedEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    const target = el.shadowRoot!.querySelector('.adopted-target') as HTMLElement
    expect(window.getComputedStyle(target).fontWeight).to.equal('700')
    expect(el.shadowRoot!.adoptedStyleSheets).to.include(sheet)
  })

  it('does not duplicate existing adoptedStyleSheets', async () => {
    const existingSheet = new CSSStyleSheet()
    existingSheet.replaceSync('.existing { color: rgb(0, 0, 255); }')

    class ExistingAdoptedEl extends HTMLElement {
      constructor() {
        super()
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.adoptedStyleSheets = [existingSheet]
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="existing">Existing</div>
        `
      }
    }

    const tag = `test-existing-adopted-${Date.now()}`
    customElements.define(tag, ExistingAdoptedEl)

    const el = await fixture<ExistingAdoptedEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    const sheets = el.shadowRoot!.adoptedStyleSheets
    expect(sheets.filter(s => s === existingSheet).length).to.equal(1)
  })

  it('ignores elements connected outside a DocumentFragment/shadowRoot', async () => {
    const directEl = document.createElement('open-styles')
    document.body.appendChild(directEl)
    await new Promise(resolve => setTimeout(resolve, 30))

    // Should remain in DOM (not removed) because it returned early
    expect(directEl.isConnected).to.be.true
    directEl.remove()
  })

  it('waits for undefined host custom element before applying styles', async () => {
    const futureTag = `future-host-${Date.now()}`
    const container = await fixture(`
      <div>
        <${futureTag}>
          <template shadowrootmode="open">
            <open-styles></open-styles>
            <div class="test-target">Async Defined</div>
          </template>
        </${futureTag}>
      </div>
    `)

    const host = container.querySelector(futureTag) as HTMLElement
    let shadow = host.shadowRoot
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' })
      shadow.innerHTML = `
        <open-styles></open-styles>
        <div class="test-target">Async Defined</div>
      `
    }

    // Now define the custom element
    class FutureHost extends HTMLElement {}
    customElements.define(futureTag, FutureHost)

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(shadow.adoptedStyleSheets.length).to.be.greaterThan(0)
    expect(shadow.querySelector('open-styles')).to.be.null
  })

  it('invalidates cached styles when new style tags are dynamically added', async () => {
    const { sheets: initialSheets } = await getOpenStyles()
    const initialCount = initialSheets.length

    const dynamicStyle = document.createElement('style')
    dynamicStyle.textContent = '.dynamic-class { opacity: 0.5; }'
    document.head.appendChild(dynamicStyle)

    // Wait for MutationObserver callback
    await new Promise(resolve => setTimeout(resolve, 30))

    const { sheets: updatedSheets } = await getOpenStyles()
    expect(updatedSheets.length).to.be.greaterThan(initialCount)

    dynamicStyle.remove()
  })

  it('exposes whenDOMReady promise', async () => {
    const isReady = await whenDOMReady
    expect(isReady).to.be.true
  })
})
