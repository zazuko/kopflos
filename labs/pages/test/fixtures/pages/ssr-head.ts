import { html } from 'lit'
import { expand } from '@zazuko/prefixes'
import type { ExecuteConstruct } from 'sparqlc'
import type { Page } from '../../../lib/Plugin.js'

export default <Page>{
  head: ({ env, data }) => `<title>${data.foo.out(env.ns.schema.title).value}</title>`,
  body: () => html`<div>Body</div>`,
  queries: {
    foo: (async (params, { env }) => {
      const dataset = env.dataset()
      const foo = env.namedNode('http://example.org/foo')
      const schemaTitle = env.namedNode(expand('schema:title')!)
      dataset.add(env.quad(foo, schemaTitle, env.literal('Bar')))
      return dataset.toStream()
    }) as ExecuteConstruct,
  },
}
