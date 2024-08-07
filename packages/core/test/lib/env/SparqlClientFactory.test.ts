import { expect } from 'chai'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { Environment } from '@zazuko/env-node'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import Factory from '../../../lib/env/SparqlClientFactory.js'
import type { KopflosFactory } from '../../../lib/env/KopflosFactory.js'

describe('lib/env/SparqlClientFactory', () => {
  it('initializes clients from endpoint URL', () => {
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
    const factory = new Environment([Kopflos, Factory])

    // then
    expect(factory.sparql.default.stream).to.be.instanceOf(StreamClient)
    expect(factory.sparql.default.parsed).to.be.instanceOf(ParsingClient)
    expect(factory.sparql.default.stream).to.have.property('endpointUrl', 'http://example.com/sparql')
    expect(factory.sparql.default.parsed).to.have.property('endpointUrl', 'http://example.com/sparql')
  })

  it('initializes clients from endpoint config', () => {
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
    const factory = new Environment([Kopflos, Factory])

    // then
    expect(factory.sparql.default.stream).to.be.instanceOf(StreamClient)
    expect(factory.sparql.default.parsed).to.be.instanceOf(ParsingClient)
    expect(factory.sparql.default.stream).to.have.property('endpointUrl', 'http://example.com/sparql')
    expect(factory.sparql.default.parsed).to.have.property('endpointUrl', 'http://example.com/sparql')
    expect(factory.sparql.default.stream).to.have.property('updateUrl', 'http://example.com/update')
    expect(factory.sparql.default.parsed).to.have.property('updateUrl', 'http://example.com/update')
  })

  it('initializes clients from client instance', () => {
    // given
    const stream = {} as StreamClient
    const parsed = {} as ParsingClient
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
    const factory = new Environment([Kopflos, Factory])

    // then
    expect(factory.sparql.default.stream).to.eq(stream)
    expect(factory.sparql.default.parsed).to.eq(parsed)
  })
})
