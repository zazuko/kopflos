const createAdoptableSheet = async (rules: CSSRuleList) => {
  const adoptableSheet = new CSSStyleSheet()
  const css = await cssFromRules(rules)
  adoptableSheet.replaceSync(css)
  return adoptableSheet
}

const cssFromRules = async (rules: CSSRuleList | undefined) => {
  if (!rules) return ''
  const parts = await Promise.all(
    Array.from(rules).map(async (rule) => {
      if ('href' in rule) {
        return cssFromImportRule((rule as CSSImportRule))
      }
      return rule.cssText || ''
    }),
  )
  return parts.join(' ')
}

const cssFromImportRule = async (rule: CSSImportRule): Promise<string | CSSRule> => {
  const link = document.createElement('link')
  link.media = 'none'
  link.href = new URL(rule.href, rule.parentStyleSheet?.href || undefined).href
  link.rel = 'stylesheet'
  link.crossOrigin = ''
  document.head.append(link)

  return new Promise((resolve) => {
    link.addEventListener('load', (e) => {
      const target = e.target as HTMLLinkElement
      const rules = target.sheet?.cssRules
      resolve(cssFromRules(rules))
      target.remove()
    }, { once: true })
    link.addEventListener('error', () => {
      link.remove()
      resolve('')
    }, { once: true })
  })
}

const adoptables = new WeakMap()

// Memoize the global styles promise
let openStylesPromise: Promise<{
  sheets: CSSStyleSheet[]
  elements: Element[]
}> | null = null
export const getOpenStyles = () => {
  if (!openStylesPromise) {
    openStylesPromise = (async () => {
      await whenDOMReady
      const sheets = Array.from(document.adoptedStyleSheets)
      const fallbackElements: Element[] = []

      const results = await Promise.all(
        Array.from(document.styleSheets).map(async (sheet) => {
          try {
            let adoptablePromise = adoptables.get(sheet)
            if (!adoptablePromise) {
              adoptablePromise = createAdoptableSheet(sheet.cssRules)
              adoptables.set(sheet, adoptablePromise)
            }
            return { type: 'sheet', value: await adoptablePromise }
          }
          catch {
            if (sheet.ownerNode) {
              return { type: 'element', value: sheet.ownerNode as Element }
            }
            return null
          }
        }),
      )

      for (const res of results) {
        if (!res) continue
        if (res.type === 'sheet') {
          sheets.push(res.value)
        }
        else if (res.type === 'element') {
          fallbackElements.push(res.value)
        }
      }

      return { sheets, elements: fallbackElements }
    })()
  }

  return openStylesPromise
}

export const whenDOMReady = new Promise((resolve) => {
  const checkReady = (event?: Event) => {
    if (document.readyState !== 'loading' || event?.type === 'DOMContentLoaded') {
      document.removeEventListener('DOMContentLoaded', checkReady)
      document.removeEventListener('readystatechange', checkReady)
      resolve(true)
    }
  }
  document.addEventListener('DOMContentLoaded', checkReady)
  document.addEventListener('readystatechange', checkReady)
  checkReady()
})

// Invalidate cache if new global style elements are added dynamically
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet')) {
          openStylesPromise = null
          return
        }
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

export class OpenStyles extends HTMLElement {
  async connectedCallback() {
    const root = this.getRootNode()
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return
    }

    const host = (root as ShadowRoot).host
    if (host?.localName.includes('-')) {
      await customElements.whenDefined(host.localName)
    }

    if (this.isConnected) {
      await this.applyStyles()
      this.remove()
    }
  }

  async applyStyles() {
    const root = this.getRootNode() as ShadowRoot
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return
    }

    const { sheets, elements } = await getOpenStyles()

    // Adopt constructable stylesheets
    if (sheets.length > 0) {
      const currentAdopted = root.adoptedStyleSheets
      if (currentAdopted.length === 0) {
        root.adoptedStyleSheets = [...sheets]
      }
      else {
        const adoptedSet = new Set(currentAdopted)
        const toAdd = sheets.filter(sheet => !adoptedSet.has(sheet))
        if (toAdd.length > 0) {
          root.adoptedStyleSheets = [...currentAdopted, ...toAdd]
        }
      }
    }

    // Inject fallback elements for cross-origin sheets if not already present
    if (elements.length > 0) {
      const nodesToInsert = []
      for (const el of elements) {
        const href = el.getAttribute?.('href')
        if (href && root.querySelector(`[href="${href}"]`)) {
          continue
        }
        nodesToInsert.push(el.cloneNode(true))
      }
      if (nodesToInsert.length > 0) {
        this.before(...nodesToInsert)
      }
    }
  }
}

customElements.define('open-styles', OpenStyles)
