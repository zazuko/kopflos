import { consumeEnvironment, consumeFocusNode } from 'lit-rdf/mixins.js'
import { html, isServer, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

if (!isServer) {
  import('./maps.js')
}

@customElement('schema-geo-map')
export default class extends consumeEnvironment(consumeFocusNode(LitElement)) {
  get latitude() {
    return this.focusNode?.out(this.rdf.ns.schema.latitude).value
  }

  get longitude() {
    return this.focusNode?.out(this.rdf.ns.schema.longitude).value
  }

  render() {
    return html`<ol-map slot="image" zoom="13" lat="${this.latitude}"
                        lon="${this.longitude}">
      <ol-layer-openstreetmap></ol-layer-openstreetmap>
      <ol-layer-vector z-index="1">
        <ol-marker-icon src="https://openlayers-elements.netlify.app/icon.png"
                        lon="${this.longitude}"
                        lat="${this.latitude}"/>
      </ol-layer-vector>
    </ol-map>`
  }
}
