import { html, definePage } from '@kopflos-labs/pages'
import plaque from './plaque.rq'

export default definePage({
  mainEntity: '/plaque/[id]',
  queries: {
    plaque,
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
                <traverse-graph slot="image" property-path="schema:image">
                    <schema-image></schema-image>
                </traverse-graph>

                <resource-label property="schema:text"></resource-label>

                <div slot="footer">
                  <plaque-button>
                    See the original
                  </plaque-button>
                </div>
              </sl-card>

              <sl-card class="card-overview card-map">
                <traverse-graph property-path="schema:geo">
                  <schema-geo-map></schema-geo-map>
                  
                  <div slot="footer">
                    <sl-button variant="primary" pill target="_blank"
                               href="http://maps.google.com/maps?&z=21&t=m&q=loc:{{ valueof 'schema:latitude' }}+{{ valueof 'schema:longitude' }}">
                      See on Google Maps
                    </sl-button>
                  </div>
                </traverse-graph>
              </sl-card>
            </main>
          </target-node>
        </data-graph>
      </rdf-environment>`
  },
})
