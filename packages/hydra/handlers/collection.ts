import type { Readable } from 'node:stream'
import merge from '@sindresorhus/merge-streams'
import type { Handler, Kopflos } from '@kopflos-cms/core'
import { log } from '@kopflos-cms/core'
import { constructQuery } from '@hydrofoil/shape-to-query'
import constraints from '@hydrofoil/shape-to-query/constraints.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import error from 'http-errors'
import { ASK } from '@tpluscode/sparql-builder'
import type { NamedNode } from '@rdfjs/types'
import { isGraphPointer } from 'is-graph-pointer'
import type { GraphPointer } from 'clownface'
import type { IriTemplate } from '@rdfine/hydra'
import { memberQueryShape, totalsQueryShape } from '../lib/queryShapes.js'
import { HydraMemberAssertionConstraint } from '../lib/shaclConstraint/HydraMemberAssertionConstraint.js'
import { createMemberIdentifier, prepareMember, saveMember, isReadable, isWritable } from '../lib/collection.js'
import { applyTemplate, fromQuery } from '../lib/iriTemplate.js'
import { tryParse } from '../lib/number.js'
import type { PrepareExpansionModel } from '../lib/partialCollection/index.js'

constraints.set(kl['hydra#MemberAssertionConstraintComponent'], HydraMemberAssertionConstraint)

export function get(this: Kopflos): Handler {
  return async ({ subject, ...req }) => {
    const hydraPlugin = this.getPlugin('hydra')
    if (!hydraPlugin) {
      throw new Error('Hydra plugin not loaded')
    }

    const env = hydraPlugin.createHydraEnv(this)
    const { hydra, rdf } = env.ns
    const endpoint = subject.out(kl.endpoint).value || 'default'
    const sparqlClient = env.sparql[endpoint]
    if (!sparqlClient) {
      return new error.InternalServerError(`SPARQL endpoint '${endpoint}' not found`)
    }

    if (!isReadable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not readable')
    }

    const strategy = hydraPlugin.partialCollectionStrategies.find(strategy => strategy.isApplicableTo(subject))

    if (!strategy) {
      log.warn('No strategy found for collection', subject.value)
    }

    let limit: number | undefined
    let offset: number | undefined
    let query: GraphPointer | undefined
    const template = subject.out(hydra.search)
    if (strategy && isGraphPointer(template)) {
      query = fromQuery(env, req.query, template)
      ;({ limit, offset } = strategy.getLimitOffset({ collection: subject, query }))
    }

    const memberQuery = constructQuery(memberQueryShape({ env, collection: subject, limit, offset }))
    const members = sparqlClient.stream.query.construct(memberQuery)

    const totalQuery = constructQuery(totalsQueryShape({ env, collection: subject }))
    const totals = await env.dataset().import(sparqlClient.stream.query.construct(totalQuery))

    const graph = env.clownface()
    if (strategy && query && isGraphPointer(template)) {
      const templateObj = env.rdfine.hydra.IriTemplate(template) as unknown as IriTemplate
      const totalItems = tryParse(env.clownface({ dataset: totals })
        .has(hydra.totalItems)
        .out(hydra.totalItems))

      const cloneQuery = () => {
        return env.clownface({
          dataset: env.dataset([...query.dataset]),
          term: query.term,
        })
      }

      function createPageLink(prepareExpansionModel: PrepareExpansionModel) {
        const expansionModel = prepareExpansionModel({
          query: cloneQuery(), totalItems, collection: subject,
        })
        if (!expansionModel) {
          return undefined
        }

        return graph.namedNode(
          applyTemplate(subject, templateObj.expand(expansionModel)),
        )
      }

      const view = graph
        .namedNode(applyTemplate(subject, templateObj.expand(query)))
        .addIn(hydra.view, subject)
      const viewParams = strategy.viewLinksTemplateParams
      view
        .addOut(rdf.type, hydra.PartialCollectionView)
      const first = createPageLink(viewParams.first)
      if (first) {
        view.addOut(hydra.first, first)
      }
      const last = createPageLink(viewParams.last)
      if (last) {
        view.addOut(hydra.last, last)
      }
      const next = createPageLink(viewParams.next)
      if (next) {
        view.addOut(hydra.next, next)
      }
      const previous = createPageLink(viewParams.previous)
      if (previous) {
        view.addOut(hydra.previous, previous)
      }
    }

    return {
      status: 200,
      body: merge([
        members,
        totals.toStream() as unknown as Readable,
        graph.dataset.toStream() as unknown as Readable,
      ]),
    }
  }
}

export function post(): Handler {
  return async ({ env, subject, body }) => {
    if (!isWritable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not writable')
    }

    if (!body.isRDF) {
      return new error.BadRequest('Expected RDF payload')
    }

    const payload = await body.pointer()
    const [newMember] = payload.out(env.ns.hydra.member).toArray()

    if (!newMember) {
      return new error.BadRequest('Expected a single hydra:member')
    }

    let createdMember: NamedNode | undefined
    try {
      createdMember = await createMemberIdentifier({
        env,
        collection: subject,
        member: newMember,
      })
    } catch (e) {
      log.error(e)
    }

    if (!createdMember) {
      return new error.BadRequest('Failed to generate resource identifier')
    }

    const graphExistsQuery = ASK`GRAPH ${createdMember} { ?s ?p ?o }`.LIMIT(1).build()
    if (await env.sparql.default.stream.query.ask(graphExistsQuery)) {
      return new error.Conflict(`Resource <${createdMember.value}> already exists`)
    }

    await saveMember(env, prepareMember(env, subject, newMember, createdMember))

    return {
      status: 201,
      headers: {
        Location: createdMember.value,
      },
    }
  }
}
