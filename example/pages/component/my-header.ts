import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { consumeFocusNode } from 'lit-rdf/mixins.js'

@customElement('my-header')
export class MyHeader extends consumeFocusNode(LitElement) {
  public static get styles() {
    return css`
      h1 {
        color: red
      }
    `
  }

  render() {
    return html`<h1>${this.focusNode?.value}</h1>`
  }
}
