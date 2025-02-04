/* eslint-disable camelcase */
import { toRdf } from 'rdf-literal'
import type { Environment } from '@rdfjs/environment/Environment.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import { dashSparql } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import type { NamedNode, Quad, BaseQuad, DataFactory, DatasetCoreFactory, Quad_Object, Quad_Predicate, Quad_Subject } from '@rdfjs/types'
import { FunctionExpression } from '@hydrofoil/shape-to-query/model/nodeExpression/FunctionExpression.js'
import ModelFactory from '@hydrofoil/shape-to-query/model/ModelFactory.js'
import type { KopflosEnvironment } from '@kopflos-cms/core'
import { log } from '@kopflos-cms/core'
import { QueryEngine } from '@comunica/query-sparql'
import { PatternBuilder } from '@hydrofoil/shape-to-query/nodeExpressions.js'
import { createVariableSequence } from '@hydrofoil/shape-to-query/lib/variableSequence.js'
import { translate } from 'sparqlalgebrajs'
import type { SparqlQuery } from 'sparqljs'
import { Generator } from 'sparqljs'
import { Store } from 'n3'
import { getStreamAsArray } from 'get-stream'
import { isGraphPointer } from 'is-graph-pointer'
import type ClownfaceFactory from 'clownface/Factory.js'

export function isReadable(env: Environment<NsBuildersFactory>, collection: GraphPointer) {
  return !collection.has(env.ns.hydra.readable, toRdf(false)).term
}

export function isWritable(env: Environment<NsBuildersFactory>, collection: GraphPointer) {
  return !collection.has([env.ns.hydra.writable, env.ns.hydra.writeable], toRdf(false)).term
}

interface CreateMemberArgs {
  env: KopflosEnvironment
  collection: GraphPointer<NamedNode>
  member: GraphPointer
}

const generator = new Generator()

/**
 * This very hacking implementation generates a URI for a new member of a collection
 * by running SPARQL SELECT over the request payload to concatenate the elements of
 * `kl-hydra:memberUriTemplate` in a `URI(CONCAT(...))` function.
 */
export async function createMemberIdentifier({ env, collection, member }: CreateMemberArgs): Promise<NamedNode | undefined> {
  const memberIdTemplate = collection.out(env.ns.kl('hydra#memberUriTemplate'))
  if (!isGraphPointer(memberIdTemplate)) {
    log.warn('Collection does not have a member URI template property')
    return undefined
  }

  const uriExpr = collection.blankNode()
    .addOut(dashSparql.concat, memberIdTemplate)
  const expr = collection
    .blankNode()
    .addList(dashSparql.uri, uriExpr)

  const functionExpression = FunctionExpression.fromPointer(expr, new ModelFactory())

  // TODO: it should be possible to process functionExpression directly over the dataset
  const uri = env.variable('uri')
  const memberVar = env.variable('member')
  const patterns = functionExpression._buildPatterns({
    rootPatterns: [],
    variable: createVariableSequence('x'),
    subject: memberVar,
    object: uri,
  }, new PatternBuilder())

  const query: SparqlQuery = {
    type: 'query',
    queryType: 'SELECT',
    variables: [uri],
    where: [
      {
        type: 'bgp',
        triples: [{
          subject: collection.term,
          predicate: env.ns.hydra.member,
          object: memberVar,
        }],
      },
      ...patterns,
    ],
    limit: 1,
    prefixes: {},
  }

  if (log.enabledFor('debug')) {
    log.debug('Executing member URI SPARQL query:', generator.stringify(query))
  }

  const engine = new QueryEngine()
  const [bindings] = await getStreamAsArray(await engine.queryBindings(translate(query), {
    sources: [new Store([...member.dataset])],
    baseIRI: collection.value,
  }))

  return bindings.get(uri) as NamedNode | undefined
}

export function prepareMember(env: Environment<NsBuildersFactory | DataFactory | DatasetCoreFactory | ClownfaceFactory>, collection: GraphPointer, newMember: GraphPointer, memberId: NamedNode) {
  const quads: BaseQuad[] = [...newMember.dataset]
    .map(({ subject, predicate, object }) =>
      env.quad(
        subject.equals(newMember.term) ? memberId : subject,
        predicate,
        object.equals(newMember.term) ? memberId : object))

  collection.out(env.ns.hydra.memberAssertion)
    .forEach(assertion => {
      let memberUsed = false
      let subject = assertion.out(env.ns.hydra.subject).term
      if (!subject) {
        memberUsed = true
        subject = memberId
      }
      let predicate = assertion.out(env.ns.hydra.property).term
      if (!predicate && !subject.equals(memberId)) {
        memberUsed = true
        predicate = memberId
      }
      let object = assertion.out(env.ns.hydra.object).term
      if (!object && !subject.equals(memberId) && !memberId.equals(predicate)) {
        memberUsed = true
        object = memberId
      }

      if (memberUsed && subject && predicate && object) {
        quads.push(env.quad(<Quad_Subject>subject, <Quad_Predicate>predicate, <Quad_Object>object))
      }
    })

  return env.clownface({ dataset: env.dataset(quads as Quad[]) })
    .node(memberId)
    .deleteIn(env.ns.hydra.member)
}

export async function saveMember(env: KopflosEnvironment, newMember: GraphPointer<NamedNode>) {
  await env.sparql.default.stream.store.put(env.dataset.toStream(newMember.dataset), {
    graph: newMember.term,
  })
}
