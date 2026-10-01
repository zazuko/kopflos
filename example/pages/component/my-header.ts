import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { FocusNode } from 'lit-rdf/controllers.js'

@customElement('my-header')
export class MyHeader extends LitElement {
  public static get styles() {
    return css`
      h1 {
        color: red
      }
    `
  }

  focusNode: FocusNode

  constructor() {
    super()
    this.focusNode = new FocusNode(this)
  }

  render() {
    return html`<h1>${this.focusNode.pointer?.value}</h1>`
  }
}
