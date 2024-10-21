import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import type { HandlerArgs } from '../../index.js'
import Kopflos, { defaultHandlerLookup as loadHandler } from '../../index.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import type {
  ResourceShapeObjectMatch,
  ResourceShapePatternMatch,
  ResourceShapeSubjectMatch,
} from '../../lib/resourceShape.js'
import { ex } from '../../../testing-helpers/ns.js'
import * as handlers from '../support/handlers.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('lib/handler', () => {
  let config: KopflosConfig

  describe('loadHandlers', () => {
    beforeEach(createStore(import.meta.url, { format: 'trig', sliceTestPath: [1, -2] }))
    beforeEach(function () {
      config = {
        baseIri: 'http://example.com/',
        codeBase: __dirname,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
        variables: {
          bar: 'bar',
        },
      }
    })

    context('subject request', () => {
      it('finds matching handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const [handler] = loadHandler(match, 'GET', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.getPerson())
      })

      it('loads handler chain', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.WebPageShape,
          subject: ex.JohnDoe,
        }

        // when
        const loadedHandlers = await Promise.all(loadHandler(match, 'GET', kopflos))

        // then
        expect(loadedHandlers).to.deep.eq([handlers.getHtml(), handlers.bindData()])
      })

      it('loads parametrised handler from ESM', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapePatternMatch = {
          api: ex.api,
          resourceShape: ex.ParametrisedShape,
          subject: ex.JohnDoe,
          subjectVariables: new Map<string, string>([['baz', 'baz']]),
          pattern: '/foo/{bar}',
        }

        // when
        const [handler] = await Promise.all(loadHandler(match, 'GET', kopflos))

        // then
        expect(handler({} as HandlerArgs)).to.deep.eq({
          status: 200,
          body: 'foobarbaz',
        })
      })

      it('loads parametrised handler from CJS', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapePatternMatch = {
          api: ex.api,
          resourceShape: ex.ParametrisedShapeCjsHandler,
          subject: ex.JohnDoe,
          subjectVariables: new Map<string, string>([['baz', 'baz']]),
          pattern: '/foo/{bar}',
        }

        // when
        const [handler] = await Promise.all(loadHandler(match, 'GET', kopflos))

        // then
        expect(handler({} as HandlerArgs)).to.deep.eq({
          status: 200,
          body: 'foobarbaz',
        })
      })

      it('finds GET handler when method is HEAD', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const [handler] = loadHandler(match, 'HEAD', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.getPerson())
      })

      it('finds handler for HEAD even if GET also exists', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.ArticleShape,
          subject: ex.foo,
        }

        // when
        const [handler] = loadHandler(match, 'HEAD', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.headArticle())
      })

      it('finds matching handler when case does not match', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const [handler] = loadHandler(match, 'PUT', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.putPerson())
      })

      it('throws when handler fails to load', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeSubjectMatch = {
          api: ex.api,
          resourceShape: ex.ArticleShape,
          subject: ex.JohnDoe,
        }

        // when
        const [handler] = loadHandler(match, 'X-FOOBAR', kopflos)

        // then
        await expect(handler).to.be.rejected
      })
    })

    context('object request', () => {
      it('finds matching handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeObjectMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
          property: rdf.ns.schema.knows,
          object: ex('JohnDoe/friends'),
        }

        // when
        const [handler] = loadHandler(match, 'POST', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.postFriends())
      })

      it('loads handler chain', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeObjectMatch = {
          api: ex.api,
          resourceShape: ex.WebPageShape,
          subject: ex.JohnDoe,
          property: rdf.ns.rdfs.seeAlso,
          object: ex('JohnDoe/friends'),
        }

        // when
        const loadedHandlers = await Promise.all(loadHandler(match, 'GET', kopflos))

        // then
        expect(loadedHandlers).to.deep.eq([handlers.getHtml(), handlers.bindData()])
      })

      it('finds GET handler when method is HEAD', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeObjectMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
          property: rdf.ns.schema.knows,
          object: ex('JohnDoe/friends'),
        }

        // when
        const [handler] = loadHandler(match, 'HEAD', kopflos)

        // then
        await expect(handler).to.eventually.eq(handlers.getFriends())
      })
    })
  })
})
