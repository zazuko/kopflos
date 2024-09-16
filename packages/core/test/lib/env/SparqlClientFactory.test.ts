import { expect } from 'chai'
import StreamClient from 'sparql-http-client/StreamClient.js'
import rdf, { Environment } from '@zazuko/env-node'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import type { Environment as E } from '@rdfjs/environment/Environment.js'
import Factory from '../../../lib/env/SparqlClientFactory.js'
import type { KopflosFactory } from '../../../lib/env/KopflosFactory.js'

describe('lib/env/SparqlClientFactory', () => {
  let factory: E<Factory>

  context('initialised from endpoint URL', () => {
    before(() => {
      // given
      const Kopflos = class implements KopflosFactory {
        static exports = ['kopflos']

        get kopflos() {
          return {
            config: {
              sparql: {
                default: 'http://example.com/sparql',
              },
            },
          }
        }
      }

      // when
      factory = new Environment([Kopflos, Factory], { parent: rdf })
    })

    it('uses factory itself with sparql clients', () => {
      // then
      expect(factory.sparql.default.stream).to.have.property('factory', factory)
      expect(factory.sparql.default.parsed).to.have.property('factory', factory)
    })

    it('initializes clients', () => {
      // then
      expect(factory.sparql.default.stream).to.be.instanceOf(StreamClient)
      expect(factory.sparql.default.parsed).to.be.instanceOf(ParsingClient)
      expect(factory.sparql.default.stream).to.have.property('endpointUrl', 'http://example.com/sparql')
      expect(factory.sparql.default.parsed).to.have.property('endpointUrl', 'http://example.com/sparql')
    })
  })

  context('initialised from endpoint config', () => {
    before(() => {
      // given
      const Kopflos = class implements KopflosFactory {
        static exports = ['kopflos']

        get kopflos() {
          return {
            config: {
              sparql: {
                default: {
                  endpointUrl: 'http://example.com/sparql',
                  updateUrl: 'http://example.com/update',
                },
              },
            },
          }
        }
      }

      // when
      factory = new Environment([Kopflos, Factory], { parent: rdf })
    })

    it('initializes clients', () => {
      // then
      expect(factory.sparql.default.stream).to.be.instanceOf(StreamClient)
      expect(factory.sparql.default.parsed).to.be.instanceOf(ParsingClient)
      expect(factory.sparql.default.stream).to.have.property('endpointUrl', 'http://example.com/sparql')
      expect(factory.sparql.default.parsed).to.have.property('endpointUrl', 'http://example.com/sparql')
      expect(factory.sparql.default.stream).to.have.property('updateUrl', 'http://example.com/update')
      expect(factory.sparql.default.parsed).to.have.property('updateUrl', 'http://example.com/update')
    })

    it('uses factory itself with sparql clients', () => {
      // then
      expect(factory.sparql.default.stream).to.have.property('factory', factory)
      expect(factory.sparql.default.parsed).to.have.property('factory', factory)
    })
  })

  context('initialised from client instances', () => {
    const stream = {
      name: 'stream',
    } as unknown as StreamClient
    const parsed = {
      name: 'parsed',
    } as unknown as ParsingClient

    before(() => {
      // given
      const Kopflos = class implements KopflosFactory {
        static exports = ['kopflos']

        get kopflos() {
          return {
            config: {
              sparql: {
                default: {
                  stream,
                  parsed,
                },
              },
            },
          }
        }
      }

      // when
      factory = new Environment([Kopflos, Factory], { parent: rdf })
    })

    it('sets clients', () => {
      // then
      expect(factory.sparql.default.stream).to.have.property('name', 'stream')
      expect(factory.sparql.default.parsed).to.have.property('name', 'parsed')
    })
  })

  context('initialised from client single instance', () => {
    const endpoints = {
      endpointUrl: 'http://example.com/sparql',
      updateUrl: 'http://example.com/update',
      storeUrl: 'http://example.com/store',
    }

    const singleClients = [
      ['stream client', new StreamClient(endpoints)],
      ['parsing client', new ParsingClient(endpoints)],
    ]

    for (const [name, client] of singleClients) {
      context(`of ${name}`, () => {
        before(() => {
          // given
          const Kopflos = class implements KopflosFactory {
            static exports = ['kopflos']

            get kopflos() {
              return {
                config: {
                  sparql: {
                    default: client,
                  },
                },
              }
            }
          }

          // when
          factory = new Environment([Kopflos, Factory], { parent: rdf })
        })

        it('sets both clients', () => {
          // then
          expect(factory.sparql.default.stream).to.be.ok
          expect(factory.sparql.default.parsed).to.be.ok
        })

        it('uses same endpoint URLs for both clients', () => {
          // then
          expect(factory.sparql.default.stream).to.have.property('endpointUrl', 'http://example.com/sparql')
          expect(factory.sparql.default.parsed).to.have.property('endpointUrl', 'http://example.com/sparql')
          expect(factory.sparql.default.stream).to.have.property('updateUrl', 'http://example.com/update')
          expect(factory.sparql.default.parsed).to.have.property('updateUrl', 'http://example.com/update')
          expect(factory.sparql.default.stream).to.have.property('storeUrl', 'http://example.com/store')
          expect(factory.sparql.default.parsed).to.have.property('storeUrl', 'http://example.com/store')
        })

        it('uses factory itself with sparql clients', () => {
          // then
          expect(factory.sparql.default.stream).to.have.property('factory', factory)
          expect(factory.sparql.default.parsed).to.have.property('factory', factory)
        })
      })
    }
  })
})
