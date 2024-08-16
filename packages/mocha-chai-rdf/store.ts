/* eslint-disable no-console,camelcase */
import * as url from 'node:url'
import * as Oxigraph from 'oxigraph'
import type { NamespaceBuilder } from '@rdfjs/namespace'
import rdf from '@zazuko/env-node'
import type { NamedNode, Quad_Graph } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'

declare module 'mocha' {
  interface Context {
    graph: AnyPointer
    store: Oxigraph.Store
  }
}

interface DatasetSourceOptions {
  format?: 'trig' | 'nq'
  loadAll?: boolean
}

interface GraphSourceOptions {
  format?: 'ttl' | 'nt'
}

type Options = (DatasetSourceOptions | GraphSourceOptions) & {
  baseIri?: string | NamespaceBuilder
}

export function createStore(base: string, options: Options = {}) {
  const format = options.format ?? 'ttl'
  let loadAll = true
  if (options.format === 'trig' || options.format === 'nq') {
    loadAll = options.loadAll || false
  }

  return async function (this: Mocha.Context) {
    const store = new Oxigraph.Store()

    const path = url.fileURLToPath(new url.URL(`${base}.${format}`))

    let dataset = await rdf.dataset().import(rdf.fromFile(path))

    let graph: Quad_Graph = rdf.defaultGraph()
    if (this.currentTest && !loadAll) {
      graph = testGraph(this.currentTest)
      dataset = dataset
        .match(null, null, null, graph)
        .map(function toDefaultGraph(quad) {
          return rdf.quad(quad.subject, quad.predicate, quad.object)
        })
    }

    for (const quad of dataset) {
      store.add(quad)
    }

    function assertNotEmpty() {
      if (dataset.size === 0) {
        throw new Error(`Test data not found in GRAPH <${encodeURI(graph.value)}>`)
      }
    }

    Object.defineProperty(this, 'graph', {
      get() {
        assertNotEmpty()
        return rdf.clownface({ dataset })
      },
      configurable: true,
    })
    Object.defineProperty(this, 'store', {
      get() {
        assertNotEmpty()
        return store
      },
      configurable: true,
    })

    // hack to remove the graph after the test just at the right moment
    const cleanup = this.test?.title.includes('before all') ? after : afterEach
    cleanup(() => {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      delete this.graph
      // @ts-ignore
      delete this.store
    })
  }
}

function testGraph(test: Mocha.Test): NamedNode {
  return rdf.namedNode(encodeURI(test.titlePath().slice(1, -1).map(removeSpaces).join('/')))
}

function removeSpaces(arg: string) {
  return arg.replaceAll(' ', '-')
}
