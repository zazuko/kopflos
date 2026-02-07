import { expect } from 'chai'
import rdf, { Environment } from '@zazuko/env-node'
import type { Environment as E } from '@rdfjs/environment/Environment.js'
import { LinkerFactoryImpl } from '../../../lib/env/LinkerFactory.js'
import type { KopflosFactory } from '../../../lib/env/KopflosFactory.js'
import { KopflosNamespaceFactory } from '../../../lib/env/KopflosNamespaceFactory.js'

describe('lib/env/LinkerFactory', function () {
  let factory: E<LinkerFactoryImpl | KopflosNamespaceFactory | KopflosFactory>

  before(function () {
    const Kopflos = class implements KopflosFactory {
      static exports = ['kopflos']

      get kopflos() {
        return {
          config: {
            baseIri: 'http://example.com/',
            sparql: {},
          },
          variables: {},
        }
      }
    }

    factory = new Environment([Kopflos, KopflosNamespaceFactory, LinkerFactoryImpl], { parent: rdf })
  })

  it('strips baseIri from resource IRI', function () {
    // given
    const iri = rdf.namedNode('http://example.com/foo/bar')

    // when
    const url = factory.linker(iri)

    // then
    expect(url).to.equal('foo/bar')
  })

  it('returns full IRI if it does not start with baseIri', function () {
    // given
    const iri = rdf.namedNode('http://other.com/foo/bar')

    // when
    const url = factory.linker(iri)

    // then
    expect(url).to.equal('http://other.com/foo/bar')
  })
})
