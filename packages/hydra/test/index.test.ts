import Kopflos from '@kopflos-cms/core'
import { createEmpty } from 'mocha-chai-rdf/store.js'
import $rdf from '@zazuko/env-node'
import { expect } from 'chai'
import inMemoryClients from '../../testing-helpers/in-memory-clients.js'
import HydraPlugin from '../index.js'

const baseIri = 'http://example.org'
const ex = $rdf.namespace(baseIri + '/')

describe('@kopflos-cms/hydra', function () {
  beforeEach(createEmpty)

  it("onStart uses the API from kopflos instance when there are no 'apis' in the options", async function () {
    // given
    const clients = inMemoryClients(this.rdf)
    const kopflos = new Kopflos({
      baseIri,
      apiPath: '/my-api',
      sparql: {
        default: clients,
      },
      plugins: [new HydraPlugin()],
    })

    // when
    await kopflos.start()

    // then
    const kl = kopflos.env.ns.kopflos
    const hydraGraph = this.rdf.dataset.filter(q => q.graph.equals(kl.hydra))
    const defaultCollectionShape = $rdf.clownface({ dataset: hydraGraph })
      .node(kl('hydra#DefaultCollectionShape'))

    expect(defaultCollectionShape.out(kopflos.env.ns.kopflos.api).term).to.deep.eq(ex('my-api'))
  })
})
