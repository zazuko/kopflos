import { LitElement, html, css } from 'lit-element'
import { customElement, property } from 'lit/decorators.js'

@customElement('my-header')
export class MyHeader extends LitElement {
  public static get styles() {
    return css`
      h1 {
        color: red
      }
    `
  }

  @property({ type: String })
  public header!: string

  render() {
    return html`<h1>${this.header}</h1>`
  }
}
