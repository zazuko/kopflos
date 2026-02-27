const createAdoptableSheet = async (rules: CSSRuleList) => {
  const adoptableSheet = new CSSStyleSheet()
  adoptableSheet.replaceSync(await cssFromRules(rules) as unknown as string)
  return adoptableSheet
}

const cssFromRules = async (rules: CSSRuleList | undefined) => Array.from(rules ?? [])
  .reduce(async (css, rule: CSSRule | CSSImportRule) => `${await css} ${
    await ('href' in rule
      ? cssFromImportRule(rule)
      : (rule as CSSStyleRule).cssText)}`,
  Promise.resolve(''))

const cssFromImportRule = async (rule: CSSImportRule): Promise<string | CSSRule> => {
  const link = document.createElement('link')
  link.media = 'none'
  link.href = new URL(rule.href, rule.parentStyleSheet?.href || undefined).href
  link.rel = 'stylesheet'
  link.crossOrigin = ''
  document.head.append(link)
  return new Promise(resolve => {
    link.addEventListener('load', (e) => {
      const target = e.target as HTMLLinkElement
      const rules = target.sheet?.cssRules
      resolve(cssFromRules(rules))
      target.remove()
    }, { once: true })
  })
}

const adoptables = new WeakMap()
export const getOpenStyles = async () => {
  await whenDOMReady
  const sheets = Array.from(document.adoptedStyleSheets)
  const elements: Element[] = []
  await Promise.all(Array.from(document.styleSheets).map(async (sheet) => {
    try {
      let adoptable = adoptables.get(sheet)
      if (adoptable === undefined) {
        adoptable = await createAdoptableSheet(sheet.cssRules)
        adoptables.set(sheet, adoptable)
      }
      sheets.push(adoptable)
    } catch (e) {
      elements.push(sheet.ownerNode!.cloneNode(true) as unknown as Element)
    }
  }))
  return { sheets, elements }
}

export const whenDOMReady = new Promise(resolve => {
  const checkReady = (event?: Event) => {
    if (document.readyState === 'complete' || event?.type === 'DOMContentLoaded') {
      document.removeEventListener('DOMContentLoaded', checkReady)
      document.removeEventListener('readystatechange', checkReady)
      resolve(true)
    }
  }
  document.addEventListener('DOMContentLoaded', checkReady)
  document.addEventListener('readystatechange', checkReady)
  checkReady()
})

export class OpenStyles extends HTMLElement {
  async connectedCallback() {
    const root = this.getRootNode()
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return
    }
    this.applyStyles()
    const host = (root as ShadowRoot).host
    if (host?.localName.match('-')) {
      await customElements.whenDefined(host.localName)
      this.applyStyles()
    }
    this.remove()
  }

  async applyStyles() {
    const root = this.getRootNode()
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE || !this.isConnected) {
      return
    }
    const { sheets, elements } = await getOpenStyles()
    await new Promise(requestAnimationFrame)
    const adopted = new Set((root as ShadowRoot).adoptedStyleSheets);
    (root as ShadowRoot).adoptedStyleSheets.push(...sheets.filter(sheet => !adopted.has(sheet)))
    this.before(...elements.filter(link => !(root as ShadowRoot).querySelector(`[href="${link.getAttribute('href')}"`)))
  }
}

customElements.define('open-styles', OpenStyles)
