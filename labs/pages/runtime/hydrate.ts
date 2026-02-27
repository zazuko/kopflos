// find all elements with the attribute defer-hydration and remove the attribute when they all become defined

const deferredElements = [...document.querySelectorAll('[defer-hydration]')].map(el => el.tagName.toLowerCase())
Promise.all(deferredElements.map(tag => customElements.whenDefined(tag))).then(() => {
  document.querySelectorAll('[defer-hydration]').forEach(el => el.removeAttribute('defer-hydration'))
})
