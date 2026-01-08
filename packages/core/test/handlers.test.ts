import type { Stream } from '@rdfjs/types'
import { expect, use } from 'chai'
import rdf from '@zazuko/env-node'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import { createStore } from 'mocha-chai-rdf/store.js'
import { getCoreRepresentation } from '../handlers.js'
import type { Body, KopflosConfig } from '../lib/Kopflos.js'
import { ex } from '../../testing-helpers/ns.js'
import Kopflos from '../lib/Kopflos.js'
import handlerLookupStub from './support/handlerLookupStub.js'

describe('@kopflos-cms/handlers.js', function () {
  use(snapshots)

  before(createStore(import.meta.url, { format: 'trig', includeDefaultGraph: true }))

  const config: KopflosConfig = {
    baseIri: 'http://example.com/',
    sparql: {
      default: 'http://localhost:8080/sparql',
    },
  }

  describe('getCoreRepresentation', function () {
    it('forwards core representation', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        }],
        handlerLookup: handlerLookupStub(getCoreRepresentation()),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        method: 'GET',
        headers: {},
        body: {} as Body,
        query: {},
      }) as unknown as { status: number; body: Stream }

      // then
      expect(response).to.have.property('status', 200)
      const dataset = await rdf.dataset().import(response.body)
      expect(dataset).canonical.toMatchSnapshot()
    })
  })
})
