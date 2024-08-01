import rdf from '@zazuko/env-node'
import { expect } from 'chai'
import { Kopflos } from '../../lib/Kopflos.js'

describe('lib/Kopflos', () => {
  describe('constructor', () => {
    it('initializes pointer', async () => {
      // given
      const graph = rdf.clownface({
        dataset: await rdf.dataset().import(rdf.fromFile('test/assets/api.ttl')),
      })

      // when
      const kopflos = new Kopflos(graph)

      // then
      expect(kopflos.apis.terms).to.deep.eq([
        rdf.namedNode('https://example.com/api'),
        rdf.namedNode('https://example.org/api'),
      ])
    })
  })
})
