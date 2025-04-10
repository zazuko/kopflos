import { expect, use } from 'chai'
import { createStore } from 'mocha-chai-rdf/store.js'
import snapshots from 'mocha-chai-rdf/snapshots.js'
import rdf from '@zazuko/env-node'
import type { Stream } from '@rdfjs/types'
import sinon from 'sinon'
import { code } from '@zazuko/vocabulary-extras-builders'
import type { KopflosConfig, Body, Options, KopflosResponse } from '../../lib/Kopflos.js'
import Kopflos from '../../lib/Kopflos.js'
import { ex } from '../../../testing-helpers/ns.js'
import type { ResourceShapeObjectMatch } from '../../lib/resourceShape.js'
import type { Handler, HandlerArgs } from '../../lib/handler.js'
import HttpMethods from '../../lib/httpMethods.js'
import * as resourceLoaders from '../../resourceLoaders.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import { loadPlugins } from '../../plugins.js'
import { kl } from '../../ns.js'
import type { DecoratorCallback, RequestDecorator } from '../../lib/decorators.js'
import handlerLookupStub from '../support/handlerLookupStub.js'

describe('lib/Kopflos', function () {
  use(snapshots)

  const testHandler: Handler = ({ subject, property, object }) => ({
    status: 200,
    body: JSON.stringify({
      subject: subject.value,
      property: property?.value,
      object: object?.value,
    }, null, 2),
  })

  const config: KopflosConfig = {
    baseIri: 'http://example.com/',
    sparql: {
      default: 'http://localhost:8080/sparql',
    },
  }

  before(createStore(import.meta.url, { format: 'trig', includeDefaultGraph: true }))

  describe('constructor', function () {
    it('initializes pointer', async function () {
      // when
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
      })

      // then
      expect(kopflos.apis.terms).to.deep.eq([ex.api1, ex.api2])
    })
  })

  describe('handleRequest', function () {
    it('returns 404 if no resource shape is found', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
        resourceShapeLookup: async () => [],
        resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        method: 'GET',
        headers: {},
        body: {} as Body,
        query: {},
      })

      // then
      expect(response).to.have.property('status', 404)
    })

    it('returns result from handler', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        }],
        handlerLookup: handlerLookupStub(testHandler),
        resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        method: 'GET',
        headers: {},
        body: {} as Body,
        query: {},
      })

      // then
      expect(response).toMatchSnapshot()
    })

    context('handler chains', function () {
      it('can access previous handler', async function () {
        // given
        const chainedHandler = (letter: string): Handler => (arg, previous) => {
          return {
            status: 200,
            body: (previous?.body || '') + letter,
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(chainedHandler('A'), chainedHandler('B'), chainedHandler('C')),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.body).to.eq('ABC')
      })

      it('can short-circuit a chain', async function () {
        // given
        const chainedHandler = (letter: string): Handler => (arg, previous) => {
          return {
            status: 200,
            body: (previous?.body || '') + letter,
            end: letter === arg.query.last,
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(chainedHandler('A'), chainedHandler('B'), chainedHandler('C')),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {
            last: 'B',
          },
        })

        // then
        expect(response.body).to.eq('AB')
      })

      it('can replace previous response', async function () {
        // given
        const chainedHandler = (letter: string): Handler => () => {
          return {
            status: 200,
            body: letter,
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(chainedHandler('A'), chainedHandler('B'), chainedHandler('C')),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.body).to.eq('C')
      })

      it('guards against falsy handler result', async function () {
        // given
        const chainedHandler = (letter: string): Handler => () => {
          return {
            status: 200,
            body: letter,
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(
            chainedHandler('A'),
            () => undefined as unknown as KopflosResponse,
            chainedHandler('C'),
          ),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.status).to.eq(500)
      })
    })

    describe('decorators', function () {
      it('decorator can end the request immediately', async function () {
        // given
        const handler = sinon.spy()
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          decoratorLookup: async () => [class {
            run() {
              return { status: 200, body: 'decorated' }
            }
          }],
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(handler),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.status).to.eq(200)
        expect(response.body).to.eq('decorated')
        expect(handler).not.to.have.been.called
      })

      it('decorator can modify handler result', async function () {
        // given
        const handler = () => ({
          status: 200,
          body: 'response',
        })
        const decorator = class implements RequestDecorator {
          async run(args: HandlerArgs, next: DecoratorCallback) {
            const response = await next()
            return {
              ...response,
              body: response.body + ' decorated',
            }
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          decoratorLookup: async () => [decorator],
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(handler),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.status).to.eq(200)
        expect(response.body).to.eq('response decorated')
      })

      it('are loaded only once for an API', async function () {
        // given
        const handler = () => ({
          status: 200,
          body: 'response',
        })
        const decorator = class implements RequestDecorator {
          async run(args: HandlerArgs, next: DecoratorCallback) {
            return next()
          }
        }
        const decoratorLookup = sinon.stub().resolves([decorator])
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          decoratorLookup,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(handler),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })
        await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(decoratorLookup).to.have.been.calledOnce
      })

      it('only applicable decorators are executed', async function () {
        // given
        const handler = () => ({
          status: 200,
          body: 'response',
        })
        const decorator = class implements RequestDecorator {
          async run(args: HandlerArgs, next: DecoratorCallback) {
            const response = await next()
            return {
              ...response,
              body: response.body + ' decorated',
            }
          }
        }
        const notApplicableDecorator = class implements RequestDecorator {
          async run(args: HandlerArgs, next: DecoratorCallback) {
            const response = await next()
            return {
              ...response,
              body: response.body + ' twice',
            }
          }

          applicable() {
            return false
          }
        }
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          decoratorLookup: async () => [decorator, notApplicableDecorator],
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(handler),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.status).to.eq(200)
        expect(response.body).to.eq('response decorated')
      })
    })

    it('guards against falsy handler result', async function () {
      // given
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        }],
        handlerLookup: handlerLookupStub(() => undefined as unknown as KopflosResponse),
        resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        method: 'GET',
        headers: {},
        body: {} as Body,
        query: {},
      })

      // then
      expect(response.status).to.eq(500)
    })

    it('wraps plain handler result in 200 result envelope', async function () {
      // given
      const body = rdf.dataset()
      const kopflos = new Kopflos(config, {
        dataset: this.rdf.dataset,
        resourceShapeLookup: async () => body,
        handlerLookup: handlerLookupStub(() => {
          throw new Error('Should not be called')
        }),
        resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
      })

      // when
      const response = await kopflos.handleRequest({
        iri: ex.foo,
        method: 'GET',
        headers: {},
        body: {} as Body,
        query: {},
      })

      // then
      expect(response).to.deep.eq({
        status: 200,
        body,
      })
    })

    context('headers', function () {
      it('are always forwarded to handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(({ headers }) => {
            return {
              status: 200,
              body: JSON.stringify({ headers }),
            }
          }),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {
            accept: 'foo/bar',
          },
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.body).to.deep.eq('{"headers":{"accept":"foo/bar"}}')
      })

      it('are forwarded to handler when empty', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(({ headers }) => {
            return {
              status: 200,
              body: JSON.stringify({ headers: Object.keys(headers).length }),
            }
          }),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.body).to.deep.eq('{"headers":0}')
      })
    })

    context('when errors occur', function () {
      const passingFunctions = {
        resourceShapeLookup: async () => [{
          api: ex.api,
          resourceShape: ex.FooShape,
          subject: ex.foo,
        }],
        handlerLookup: handlerLookupStub(testHandler),
        resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
      }

      const throws = () => {
        throw new Error('Error')
      }
      const throwsNonError = () => {
        // eslint-disable-next-line no-throw-literal
        throw 'Error'
      }
      const failingFunctions: [string, Partial<Options>][] = [throws, throwsNonError].flatMap(fun => [
        ['resourceShapeLookup ' + fun.name, { resourceShapeLookup: fun }],
        ['resourceLoaderLookup ' + fun.name, { resourceLoaderLookup: fun }],
        ['handlerLookup ' + fun.name, { handlerLookup: fun }],
        ['handler ' + fun.name, { handlerLookup: handlerLookupStub(fun) }],
      ])

      for (const [name, failingFunction] of failingFunctions) {
        it('they are handled gracefully when ' + name, async function () {
          // given
          const kopflos = new Kopflos(config, {
            dataset: this.rdf.dataset,
            ...passingFunctions,
            ...failingFunction,
          })

          // when
          const response = await kopflos.handleRequest({
            iri: ex.foo,
            method: 'GET',
            headers: {},
            body: {} as Body,
            query: {},
          })

          // then
          expect(response.status).to.eq(500)
        })
      }
    })

    context('body', function () {
      it('is forwarded to handler when defined', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
          resourceShapeLookup: async () => [{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
          }],
          handlerLookup: handlerLookupStub(({ body }) => {
            return {
              status: 200,
              body: JSON.stringify({ body: !!body }),
            }
          }),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.foo,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response.body).to.deep.eq('{"body":true}')
      })
    })

    context('when no handler is found', function () {
      for (const method of ['GET', 'HEAD'] as const) {
        context('when method is ' + method, function () {
          it('forwards core representation', async function () {
            // given
            const kopflos = new Kopflos(config, {
              dataset: this.rdf.dataset,
              resourceShapeLookup: async () => [{
                api: ex.api,
                resourceShape: ex.FooShape,
                subject: ex.foo,
              }],
              handlerLookup: () => undefined,
            })

            // when
            const response = await kopflos.handleRequest({
              iri: ex.foo,
              method,
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
      }

      for (const method of HttpMethods.filter(m => m !== 'GET' && m !== 'HEAD')) {
        context('when method is ' + method, function () {
          it('returns error', async function () {
            // given
            const kopflos = new Kopflos(config, {
              dataset: this.rdf.dataset,
              resourceShapeLookup: async () => [{
                api: ex.api,
                resourceShape: ex.FooShape,
                subject: ex.foo,
              }],
              handlerLookup: () => undefined,
            })

            // when
            const response = await kopflos.handleRequest({
              iri: ex.foo,
              method,
              headers: {},
              body: {} as Body,
              query: {},
            })

            // then
            expect(response).to.have.property('status', 405)
          })
        })
      }
    })

    describe('property handlers', function () {
      it('returns result from handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.dataset,
          resourceShapeLookup: async () => [<ResourceShapeObjectMatch>{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
            property: ex.bar,
            object: ex.baz,
          }],
          handlerLookup: handlerLookupStub(testHandler),
          resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
        })

        // when
        const response = await kopflos.handleRequest({
          iri: ex.baz,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(response).toMatchSnapshot()
      })

      it('loads core representation of matched subject', async function () {
        // given
        const resourceLoader = sinon.stub().returns(rdf.dataset().toStream())
        const kopflos = new Kopflos(config, {
          dataset: this.dataset,
          resourceShapeLookup: async () => [<ResourceShapeObjectMatch>{
            api: ex.api,
            resourceShape: ex.FooShape,
            subject: ex.foo,
            property: ex.bar,
            object: ex.baz,
          }],
          handlerLookup: handlerLookupStub(testHandler),
          resourceLoaderLookup: async () => resourceLoader,
        })

        // when
        await kopflos.handleRequest({
          iri: ex.baz,
          method: 'GET',
          headers: {},
          body: {} as Body,
          query: {},
        })

        // then
        expect(resourceLoader).to.have.been.calledWith(ex.foo, kopflos)
      })

      context('when no handler is found', function () {
        for (const method of HttpMethods) {
          context('when method is ' + method, function () {
            it('returns 405', async function () {
              // given
              const kopflos = new Kopflos(config, {
                dataset: this.dataset,
                resourceShapeLookup: async () => [<ResourceShapeObjectMatch>{
                  api: ex.api,
                  resourceShape: ex.FooShape,
                  subject: ex.foo,
                  property: ex.bar,
                  object: ex.baz,
                }],
                handlerLookup: () => undefined,
                resourceLoaderLookup: async () => () => rdf.dataset().toStream(),
              })

              // when
              const response = await kopflos.handleRequest({
                iri: ex.baz,
                method,
                headers: {},
                body: {} as Body,
                query: {},
              })

              // then
              expect(response.status).to.eq(405)
            })
          })
        }
      })
    })
  })

  describe('start', function () {
    const shorthands = rdf.termMap([
      [kl.DescribeLoader, resourceLoaders.describe],
      [kl.OwnGraphLoader, resourceLoaders.fromOwnGraph],
    ])
    for (const [shorthand, implementation] of shorthands) {
      let instance: Kopflos
      beforeEach(async function () {
        instance = new Kopflos({
          ...config,
          apiGraphs: [ex.PublicApi, ex.PrivateApi],
          sparql: {
            default: inMemoryClients(this.rdf),
          },
        }, {
          plugins: await loadPlugins({}),
        })
        await instance.loadApiGraphs()
      })

      context(`inserts ${shorthand.value} shorthand`, function () {
        it('which has correct type', async function () {
          // then
          const type = instance.graph.node(shorthand).out(rdf.ns.rdf.type)
          expect(type).to.eq(code.EcmaScriptModule)
        })

        it('which can be loaded', async function () {
          // then
          const loadedFunc = await instance.env.load(instance.graph.node(shorthand))
          expect(loadedFunc).to.eq(implementation)
        })
      })
    }

    it('calls onStart on plugins once', async function () {
      // given
      const onStart = sinon.spy()
      const plugin = class {
        onStart = onStart
      }
      const instance = new Kopflos({
        ...config,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }, {
        plugins: [plugin],
      })

      // when
      await instance.start()

      // then
      expect(onStart).to.have.been.calledOnce
    })
  })

  describe('stop', function () {
    it('calls onStop on plugins', async function () {
      // given
      const onStop = sinon.spy()
      const plugin = class {
        onStop = onStop
      }
      const instance = new Kopflos({
        ...config,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }, {
        plugins: [plugin],
      })

      // when
      await instance.stop()

      // then
      expect(onStop).to.have.been.called
    })

    it('ignores plugins without onStop', async function () {
      // given
      const plugin = class {}
      const instance = new Kopflos({
        ...config,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }, {
        plugins: [plugin],
      })

      // when
      await instance.stop()
    })
  })

  describe('ready', function () {
    it('calls onReady on plugins', async function () {
      // given
      const onReady = sinon.spy()
      const plugin = class {
        onReady = onReady
      }
      const instance = new Kopflos({
        ...config,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }, {
        plugins: [plugin],
      })

      // when
      await instance.ready()

      // then
      expect(onReady).to.have.been.called
    })

    it('ignores plugins without onReady', async function () {
      // given
      const plugin = class {}
      const instance = new Kopflos({
        ...config,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }, {
        plugins: [plugin],
      })

      // when
      await instance.ready()
    })
  })
})
