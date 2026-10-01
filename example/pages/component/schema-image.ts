import { css, html, LitElement, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Environment, FocusNode } from 'lit-rdf/controllers.js'

@customElement('schema-image')
export class SchemaImage extends LitElement {
  static styles = css`
      :host {
        display: flex;
        align-items: center;
        height: 100%;
      }

      img {
        max-width: 100%;
        max-height: 100%;
      }
    `

  @property({ type: String })
  public alt?: string

  declare focusNode: FocusNode
  declare rdf: Environment

  constructor() {
    super()
    this.focusNode = new FocusNode(this)
    this.rdf = new Environment(this)
  }

  protected render(): unknown {
    const src = this.focusNode.pointer?.out(this.rdf.value.ns.schema.contentUrl).value
    if (!src) {
      return nothing
    }

    return html`
            <img part="image" src="${src}" alt="${this.alt}"/>
        `
  }
}
