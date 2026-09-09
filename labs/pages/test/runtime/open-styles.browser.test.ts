import { expect, fixture } from '@open-wc/testing'
import { getOpenStyles, whenDOMReady, OpenStyles } from '../../runtime/open-styles.js'

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

  it('resolves and adopts rules from @import rules in stylesheets', async () => {
    const importedCss = '.imported-rule { color: rgb(0, 128, 255); }'
    const blob = new Blob([importedCss], { type: 'text/css' })
    const blobUrl = URL.createObjectURL(blob)

    const importStyleEl = document.createElement('style')
    importStyleEl.textContent = `@import "${blobUrl}";`
    document.head.appendChild(importStyleEl)

    await new Promise(resolve => setTimeout(resolve, 50))

    class ImportShadowEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="imported-rule">Imported text</div>
        `
      }
    }

    const tag = `test-import-${Date.now()}`
    customElements.define(tag, ImportShadowEl)

    const el = await fixture<ImportShadowEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 100))

    const target = el.shadowRoot!.querySelector('.imported-rule') as HTMLElement
    expect(window.getComputedStyle(target).color).to.equal('rgb(0, 128, 255)')

    importStyleEl.remove()
    URL.revokeObjectURL(blobUrl)
  })

  it('handles failed @import rules gracefully', async () => {
    const badBlob = new Blob([''], { type: 'text/css' })
    const badBlobUrl = URL.createObjectURL(badBlob)
    URL.revokeObjectURL(badBlobUrl)

    const badImportStyleEl = document.createElement('style')
    badImportStyleEl.textContent = `@import "${badBlobUrl}"; .after-bad-import { color: rgb(1, 2, 3); }`
    document.head.appendChild(badImportStyleEl)

    await new Promise(resolve => setTimeout(resolve, 50))

    class BadImportShadowEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="after-bad-import">Still styled</div>
        `
      }
    }

    const tag = `test-bad-import-${Date.now()}`
    customElements.define(tag, BadImportShadowEl)

    const el = await fixture<BadImportShadowEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 100))

    const target = el.shadowRoot!.querySelector('.after-bad-import') as HTMLElement
    expect(window.getComputedStyle(target).color).to.equal('rgb(1, 2, 3)')

    badImportStyleEl.remove()
  })

  it('falls back to inserting DOM element clone when stylesheet cssRules is inaccessible', async () => {
    const fallbackLink = document.createElement('link')
    fallbackLink.rel = 'stylesheet'
    const blob = new Blob(['.fallback-text { color: rgb(100, 200, 50); }'], { type: 'text/css' })
    const blobUrl = URL.createObjectURL(blob)
    fallbackLink.href = blobUrl
    document.head.appendChild(fallbackLink)

    await new Promise((resolve) => {
      fallbackLink.addEventListener('load', resolve, { once: true })
      fallbackLink.addEventListener('error', resolve, { once: true })
    })

    const sheet = fallbackLink.sheet!
    Object.defineProperty(sheet, 'cssRules', {
      get() {
        throw new DOMException('Cannot access rules', 'SecurityError')
      },
      configurable: true,
    })

    await new Promise(resolve => setTimeout(resolve, 30))

    class FallbackShadowEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div class="fallback-text">Fallback test</div>
        `
      }
    }

    const tag = `test-fallback-${Date.now()}`
    customElements.define(tag, FallbackShadowEl)

    const el = await fixture<FallbackShadowEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    const insertedLink = el.shadowRoot!.querySelector(`link[rel="stylesheet"][href="${blobUrl}"]`)
    expect(insertedLink).to.not.be.null

    fallbackLink.remove()
    URL.revokeObjectURL(blobUrl)
  })

  it('does not insert duplicate fallback link elements if already present in shadow root', async () => {
    const fallbackLink = document.createElement('link')
    fallbackLink.rel = 'stylesheet'
    const blob = new Blob(['.existing-fallback { color: rgb(50, 50, 50); }'], { type: 'text/css' })
    const blobUrl = URL.createObjectURL(blob)
    fallbackLink.href = blobUrl
    document.head.appendChild(fallbackLink)

    await new Promise((resolve) => {
      fallbackLink.addEventListener('load', resolve, { once: true })
      fallbackLink.addEventListener('error', resolve, { once: true })
    })

    const sheet = fallbackLink.sheet!
    Object.defineProperty(sheet, 'cssRules', {
      get() {
        throw new DOMException('Cannot access rules', 'SecurityError')
      },
      configurable: true,
    })

    await new Promise(resolve => setTimeout(resolve, 30))

    class ExistingFallbackEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <link rel="stylesheet" href="${blobUrl}">
          <open-styles></open-styles>
          <div>Existing fallback test</div>
        `
      }
    }

    const tag = `test-existing-fallback-${Date.now()}`
    customElements.define(tag, ExistingFallbackEl)

    const el = await fixture<ExistingFallbackEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    const insertedLinks = el.shadowRoot!.querySelectorAll(`link[href="${blobUrl}"]`)
    expect(insertedLinks.length).to.equal(1)

    fallbackLink.remove()
    URL.revokeObjectURL(blobUrl)
  })

  it('invalidates cache when a link[rel=stylesheet] element is dynamically added, but not for other elements', async () => {
    const { sheets: beforeSheets } = await getOpenStyles()
    const beforeCount = beforeSheets.length

    const iconLink = document.createElement('link')
    iconLink.rel = 'icon'
    iconLink.href = 'favicon.ico'
    document.head.appendChild(iconLink)
    await new Promise(resolve => setTimeout(resolve, 30))

    const { sheets: sameSheets } = await getOpenStyles()
    expect(sameSheets.length).to.equal(beforeCount)
    iconLink.remove()

    const linkStyle = document.createElement('link')
    linkStyle.rel = 'stylesheet'
    const blob = new Blob(['.link-dyn { color: rgb(255, 0, 255); }'], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    linkStyle.href = url
    document.head.appendChild(linkStyle)

    await new Promise(resolve => setTimeout(resolve, 50))

    const { sheets: afterSheets } = await getOpenStyles()
    expect(afterSheets.length).to.be.greaterThan(beforeCount)

    linkStyle.remove()
    URL.revokeObjectURL(url)
  })

  it('returns early when applyStyles is called on an element not in a DocumentFragment', async () => {
    const directEl = new OpenStyles()
    document.body.appendChild(directEl)
    await directEl.applyStyles()
    expect(directEl.isConnected).to.be.true
    directEl.remove()
  })

  it('appends only new stylesheets when some are already adopted in shadow root', async () => {
    const { sheets } = await getOpenStyles()
    expect(sheets.length).to.be.greaterThan(0)

    class PartialAdoptedEl extends HTMLElement {
      constructor() {
        super()
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.adoptedStyleSheets = [...sheets]
      }

      connectedCallback() {
        this.shadowRoot!.innerHTML = `
          <open-styles></open-styles>
          <div>All already adopted</div>
        `
      }
    }

    const tag = `test-all-adopted-${Date.now()}`
    customElements.define(tag, PartialAdoptedEl)

    const el = await fixture<PartialAdoptedEl>(`<${tag}></${tag}>`)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(el.shadowRoot!.adoptedStyleSheets.length).to.equal(sheets.length)
  })
})
