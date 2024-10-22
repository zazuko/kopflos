/// <reference types="chai-html" />
import { createStore } from 'mocha-chai-rdf/store.js'
import { createEnv } from '@kopflos-cms/core/env.js'
import { parseDocument } from 'htmlparser2'
import { load } from 'cheerio'
import type { AnyPointer, GraphPointer } from 'clownface'
import { expect } from 'chai'
import { replaceTemplates } from '../../lib/replaceTemplates.js'
import type { TemplateFunc } from '../../index.js'

describe('@kopflos-labs/html-template/lib/replaceTemplates.js', () => {
  before(createStore(import.meta.url, {
    format: 'ttl',
  }))

  const env = createEnv({
    baseIri: 'http://example.org/',
    sparql: {
      default: 'http://example.org/sparql',
    },
  })

  context('<template target-class>', () => {
    it('finds target by absolute url', function () {
      // given
      const graph = this.rdf.graph

      // when
      const result = runTest(`<html>
<body>
<template target-class="http://example.org/Class">
_VALUE_
</template>  
</body>
</html>`, graph)

      // then
      expect(result.html()).html.to.eq(`<html>
<body>
http://example.org/Foo
</body>
</html>`)
    })
  })

  context('<template property>', () => {
    it('descends into the graph', function () {
      it('finds target by absolute url', function () {
        // given
        const graph = this.rdf.graph

        // when
        const result = runTest(`<html>
<body>
<template target-class="http://example.org/Class">
    <template property="schema:image">
        <div>
          <template property="schema:url">
              <img src="_VALUE_" />
          </template>
        </div>
    </template>
</template>
</body>
</html>`, graph)

        // then
        expect(result.html()).html.to.eq(`<html>
<body>
<div>
  <img src="http://example.org/foo.jpg" />
</div>
</body>
</html>`)
      })
    })
  })

  function runTest(html: string, graph: AnyPointer, evaluateTemplate: TemplateFunc = printValue) {
    const dom = parseDocument(html)
    const $ = load(dom)
    replaceTemplates($, env, evaluateTemplate)(graph)
    return $
  }

  function printValue(template: string, ptr: GraphPointer) {
    return template.replaceAll('_VALUE_', ptr.value)
  }
})
