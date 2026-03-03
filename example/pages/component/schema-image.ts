import { consumeEnvironment, consumeFocusNode } from 'lit-rdf/mixins.js'
import { css, html, LitElement, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('schema-image')
export class SchemaImage extends consumeFocusNode(consumeEnvironment(LitElement)) {
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

  protected render(): unknown {
    const src = this.focusNode?.out(this.rdf.ns.schema.contentUrl).value
    if (!src) {
      return nothing
    }

    return html`
            <img part="image" src="${src}" alt="${this.alt}"/>
        `
  }
}
