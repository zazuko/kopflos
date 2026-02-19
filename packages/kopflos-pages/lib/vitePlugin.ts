import {Plugin} from "vite";
import {parseDocument} from "htmlparser2";
import {load} from "cheerio";
import {SsrOptions} from "./ssr.js";

export default (ssrOptions: SsrOptions): Plugin => {
    return {
        name: 'pages-transform',
        transformIndexHtml: {
            order: "pre",
            handler(template) {
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
</script>`)

                if(ssrOptions?.deferHydration) {
                    body.append(`
<script type="module">
    import '@kopflos-labs/pages/runtime/hydrate.js';
</script>
                `)
                }

                return  $.html({
                    xml: {
                        xmlMode: false,
                    },
                })
            }
        }
    }
}
