import { consumeEnvironment, consumeFocusNode } from 'lit-rdf/mixins.js'
import { html, LitElement } from 'lit'
import '@openlayers-elements/core/ol-map.js'
import '@openlayers-elements/maps/ol-layer-openstreetmap.js'
import '@openlayers-elements/maps/ol-marker-icon.js'
import '@openlayers-elements/core/ol-layer-vector.js'
import { customElement } from 'lit/decorators.js'

@customElement('schema-geo-map-button')
export default class extends consumeEnvironment(consumeFocusNode(LitElement)) {
  get latitude() {
    return this.focusNode?.out(this.rdf.ns.schema.latitude).value
  }

  get longitude() {
    return this.focusNode?.out(this.rdf.ns.schema.longitude).value
  }

  render() {
    return html`
      <sl-button variant="primary" pill target="_blank"
                 href="http://maps.google.com/maps?&z=21&t=m&q=loc:${this.latitude}+${this.longitude}">
        See on Google Maps
      </sl-button>`
  }
}
