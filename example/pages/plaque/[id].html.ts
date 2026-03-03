import { html, definePage } from '@kopflos-labs/pages'
import plaque from './plaque.rq'

export default definePage({
  mainEntity: '/plaque/[id]',
  queries: {
    plaque,
  },
  async import() {
    // TODO: implicitly import by convention
    await import('./plaque.js')
  },
  head({ env, data }) {
    const name = data.plaque
      .has(env.ns.rdf.type, env.kopflos.appNs('/api/schema/Plaque'))
      .out(env.ns.schema.name).value

    return `<title> ${name} ::: Read the Plaque</title>`
  },
  body({ env }) {
    return html`
      <rdf-environment>
        <data-graph data-graph="plaque">
          <target-node target-class="${env.kopflos.appNs('/api/schema/Plaque').value}">
            <header>
              <traverse-graph property-path="schema:name">
                <my-header></my-header>
              </traverse-graph>
            </header>
            <main>
              <sl-card class="card-overview">
                <traverse-graph property-path="schema:image">
                    <schema-image slot="image"></schema-image>
                </traverse-graph>

                <resource-label property="schema:text"></resource-label>

                <div slot="footer">
                  <sl-button variant="primary" pill target="_blank"
                             href="https://readtheplaque.com/plaque/{{ valueof 'schema:identifier' }}">See the
                    original
                  </sl-button>
                </div>
              </sl-card>

              <sl-card class="card-overview card-map">
                <template property="schema:geo">
                  <ol-map slot="image" zoom="13" lat="{{ valueof 'schema:latitude' }}"
                          lon="{{ valueof 'schema:longitude' }}">
                    <ol-layer-openstreetmap></ol-layer-openstreetmap>
                    <ol-layer-vector z-index="1">
                      <ol-marker-icon src="https://openlayers-elements.netlify.app/icon.png"
                                      lon="{{ valueof 'schema:longitude' }}"
                                      lat="{{ valueof 'schema:latitude' }}"/>
                    </ol-layer-vector>
                  </ol-map>

                  <div slot="footer">
                    <sl-button variant="primary" pill target="_blank"
                               href="http://maps.google.com/maps?&z=21&t=m&q=loc:{{ valueof 'schema:latitude' }}+{{ valueof 'schema:longitude' }}">
                      See on Google Maps
                    </sl-button>
                  </div>
                </template>
              </sl-card>
            </main>
          </target-node>
        </data-graph>
      </rdf-environment>`
  },
})
