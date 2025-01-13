import type { Readable } from 'node:stream'
import merge from '@sindresorhus/merge-streams'
import type { Handler } from '@kopflos-cms/core'
import { log } from '@kopflos-cms/core'
import { constructQuery } from '@hydrofoil/shape-to-query'
import constraints from '@hydrofoil/shape-to-query/constraints.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import error from 'http-errors'
import { isGraphPointer } from 'is-graph-pointer'
import type { GraphPointer } from 'clownface'
import type { IriTemplate } from '@rdfine/hydra'
import { memberQueryShape, totalsQueryShape } from '../lib/queryShapes.js'
import { HydraMemberAssertionConstraint } from '../lib/shaclConstraint/HydraMemberAssertionConstraint.js'
import { isReadable, isWritable } from '../lib/collection.js'
import { combineTemplate, fromQuery } from '../lib/iriTemplate.js'
import { tryParse } from '../lib/number.js'
import type { HydraPlugin } from '../index.js'
import type { PrepareExpansionModel } from '../lib/partialCollection/index.js'

constraints.set(kl['hydra#MemberAssertionConstraintComponent'], HydraMemberAssertionConstraint)

export function get(): Handler {
  return async ({ instance, subject, ...req }) => {
    const hydraPlugin = instance.getPlugin<HydraPlugin>('@kopflos-cms/hydra')
    if (!hydraPlugin) {
      throw new Error('Hydra plugin not loaded')
    }

    const { env } = hydraPlugin
    const { hydra, rdf } = env.ns

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
    const members = env.sparql.default.stream.query.construct(memberQuery)

    const totalQuery = constructQuery(totalsQueryShape({ env, collection: subject }))
    const totals = await env.dataset().import(env.sparql.default.stream.query.construct(totalQuery))

    const view = env.clownface()
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
        return view.namedNode(
          combineTemplate(subject, templateObj.expand(prepareExpansionModel({
            query: cloneQuery(), totalItems, collection: subject,
          }))),
        )
      }

      const { first, last, next, previous } = strategy.viewLinksTemplateParams
      view.node(subject).addOut(hydra.view, view => {
        view
          .addOut(rdf.type, hydra.PartialCollectionView)
          .addOut(hydra.first, createPageLink(first))
          .addOut(hydra.last, createPageLink(last))
          .addOut(hydra.next, createPageLink(next))
          .addOut(hydra.previous, createPageLink(previous))
      })
    }

    return {
      status: 200,
      body: merge([
        members,
        totals.toStream() as unknown as Readable,
        view.dataset.toStream() as unknown as Readable,
      ]),
    }
  }
}

export function post(): Handler {
  return ({ env, subject }) => {
    if (!isWritable(env, subject)) {
      return new error.MethodNotAllowed('Collection is not writable')
    }

    throw new Error('Not implemented')
  }
}
