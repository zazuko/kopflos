// Check if we require the template shadow root polyfill.
(async () => {
  if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) { // eslint-disable-line no-prototype-builtins
    // Fetch the template shadow root polyfill.
    const { hydrateShadowRoots } = await import('@webcomponents/template-shadowroot/template-shadowroot.js')

    // Apply the polyfill. This is a one-shot operation, so it is important
    // it happens after all HTML has been parsed.
    hydrateShadowRoots(document.body)

    // At this point, browsers without native declarative shadow DOM
    // support can paint the initial state of your components!
    document.body.removeAttribute('dsd-pending')
  }
})()
