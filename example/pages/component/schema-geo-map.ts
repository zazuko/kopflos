import { html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import '@openlayers-elements/core/ol-map.js'
import '@openlayers-elements/maps/ol-layer-openstreetmap.js'
import '@openlayers-elements/maps/ol-marker-icon.js'
import '@openlayers-elements/core/ol-layer-vector.js'
import { Environment, FocusNode } from 'lit-rdf/controllers.js'

@customElement('schema-geo-map')
export default class extends LitElement {
  declare focusNode: FocusNode
  declare rdf: Environment

  constructor() {
    super()
    this.focusNode = new FocusNode(this)
    this.rdf = new Environment(this)
  }

  get latitude() {
    return this.focusNode.pointer?.out(this.rdf.value.ns.schema.latitude).value
  }

  get longitude() {
    return this.focusNode.pointer?.out(this.rdf.value.ns.schema.longitude).value
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
