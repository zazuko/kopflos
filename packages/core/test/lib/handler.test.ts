import { createStore } from 'mocha-chai-rdf/store.js'
import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import Kopflos, { defaultHandlerLookup as loadHandler } from '../../index.js'
import type { KopflosConfig } from '../../lib/Kopflos.js'
import inMemoryClients from '../../../testing-helpers/in-memory-clients.js'
import type { ResourceShapeObjectMatch, ResourceShapeTypeMatch } from '../../lib/resourceShape.js'
import { ex } from '../../../testing-helpers/ns.js'
import * as handlers from '../support/handlers.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('lib/handler', () => {
  let config: KopflosConfig

  describe('loadHandler', () => {
    beforeEach(createStore(import.meta.url, { format: 'trig', sliceTestPath: [1, -2] }))
    beforeEach(function () {
      config = {
        codeBase: __dirname,
        sparql: {
          default: inMemoryClients(this.rdf),
        },
      }
    })

    context('subject request', () => {
      it('finds matching handler', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeTypeMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const handler = await loadHandler(match, 'GET', kopflos)

        // then
        expect(handler).to.eq(handlers.getPerson)
      })

      it('finds GET handler when method is HEAD', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeTypeMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const handler = await loadHandler(match, 'HEAD', kopflos)

        // then
        expect(handler).to.eq(handlers.getPerson)
      })

      it('finds handler for HEAD even if GET also exists', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeTypeMatch = {
          api: ex.api,
          resourceShape: ex.ArticleShape,
          subject: ex.foo,
        }

        // when
        const handler = await loadHandler(match, 'HEAD', kopflos)

        // then
        expect(handler).to.eq(handlers.headArticle)
      })

      it('finds matching handler when case does not match', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeTypeMatch = {
          api: ex.api,
          resourceShape: ex.PersonShape,
          subject: ex.JohnDoe,
        }

        // when
        const handler = await loadHandler(match, 'PUT', kopflos)

        // then
        expect(handler).to.eq(handlers.putPerson)
      })

      it('throws when handler fails to load', async function () {
        // given
        const kopflos = new Kopflos(config, {
          dataset: this.rdf.dataset,
        })
        const match: ResourceShapeTypeMatch = {
          api: ex.api,
          resourceShape: ex.ArticleShape,
          subject: ex.JohnDoe,
        }

        // then
        await expect(loadHandler(match, 'X-FOOBAR', kopflos)).to.be.rejected
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
        const handler = await loadHandler(match, 'POST', kopflos)

        // then
        expect(handler).to.eq(handlers.postFriends)
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
        const handler = await loadHandler(match, 'HEAD', kopflos)

        // then
        expect(handler).to.eq(handlers.getFriends)
      })
    })
  })
})
