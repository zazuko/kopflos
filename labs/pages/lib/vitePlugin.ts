import { existsSync } from 'node:fs'
import type { Plugin } from 'vite'
import { parseDocument } from 'htmlparser2'
import { load } from 'cheerio'
import type { SsrOptions } from './ssr.js'

export default ({ deferHydration = true }: SsrOptions = {}): Plugin => {
  return {
    name: 'pages-transform',
    transformIndexHtml: {
      order: 'pre',
      handler(template, { filename, originalUrl }) {
        const depsModule = (originalUrl || filename).replace(/\.html$/, '.html.js')
        const clientOnlyDepsModule = (originalUrl || filename).replace(/\.html$/, '.client.js')

        const depsModuleImport = getImport(depsModule)
        const clientOnlyDepsModuleImport = getImport(clientOnlyDepsModule)

        const $ = load(parseDocument(template))

        $('head').append(`    
<style>
    body[dsd-pending] {
        display: none;
    }
</style>`)
        const body = $('body')

        body
          .attr('dsd-pending', '')
          .prepend(`
<script>
    if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
        // This browser has native declarative shadow DOM support, so we can
        // allow painting immediately.
        document.body.removeAttribute('dsd-pending')
    }
</script>
<script type="module">
    import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
    import '@kopflos-labs/pages/runtime/open-styles.js'
</script>`).append(`
<script type="module">
    import '@kopflos-labs/pages/shadow.js'
    ${depsModuleImport}
    ${clientOnlyDepsModuleImport}
</script>`)

        if (deferHydration) {
          body.append(`
<script type="module">
    import '@kopflos-labs/pages/runtime/hydrate.js';
</script>
                `)
        }

        return $.html({
          xml: {
            xmlMode: false,
          },
        })
      },
    },
  }
}

function getImport(module: string) {
  if (existsSync(module) || existsSync(module.replace(/\.js$/, '.ts'))) {
    return `import '${module}';`
  }

  return ''
}
