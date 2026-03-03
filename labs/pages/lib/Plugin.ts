import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'
import type { HandlerArgs, Kopflos, KopflosEnvironment, KopflosPlugin } from '@kopflos-cms/core'
import type { DatasetCore } from '@rdfjs/types'
import { globIterate } from 'glob'
import type { AnyPointer } from 'clownface'
import type { TemplateResult } from 'lit'
import type { ExecuteConstruct } from 'sparqlc'
import type { BuildConfiguration } from '@kopflos-cms/vite'
import { VitePlugin } from '@kopflos-cms/vite'
import type { ViteDevServer } from 'vite'
import viteSparqlLoaderPlugin from 'vite-plugin-sparql'
import * as esbuild from 'esbuild'
import esbuildSparqlLoaderPlugin from 'esbuild-plugin-sparql'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import pagesVitePlugin from './vitePlugin.js'
import type { SsrOptions } from './ssr.js'
import { toPattern } from './route.js'

export interface QueryDescriptor {
  query: ExecuteConstruct
  endpoint?: string
}

export type QueryMap = Record<string, QueryDescriptor | ExecuteConstruct>

export interface Page<TQueries extends QueryMap | undefined = undefined> {
  parameters?: Record<string, string>
  head?: string | ((args: HandlerArgs & { data: Record<keyof TQueries, AnyPointer> }) => string | Promise<string>)
  import?: () => Promise<void>
  body: (args: HandlerArgs & { data: Record<keyof TQueries, AnyPointer> }) => TemplateResult | Promise<TemplateResult>
  data?: Record<string, AnyPointer | DatasetCore>
  queries?: TQueries
}

interface Options {
  api: string
  path?: string
  pattern?: string
  ssrOptions?: SsrOptions
}

interface PagesPlugin extends KopflosPlugin {
  readonly path: string
  readonly ssrOptions: SsrOptions
  getDevServer({ env, plugins }: Kopflos): Promise<ViteDevServer>
}

declare module '@kopflos-cms/core' {
  interface Plugins {
    '@kopflos-labs/pages': PagesPlugin
  }
}

export const definePage = <TQueries extends Record<string, QueryDescriptor | ExecuteConstruct>>(renderer: Page<TQueries>) => renderer

export default class extends VitePlugin implements PagesPlugin {
  private readonly pattern: string
  public readonly path: string
  private readonly api: string
  public readonly ssrOptions: SsrOptions
  private readonly buildConfiguration: BuildConfiguration

  constructor({ api, path = 'pages', pattern = '**/*.html.ts', ssrOptions = {} }: Options) {
    const finalSsrOptions: SsrOptions = {
      deferHydration: true,
      ...ssrOptions,
    }
    const buildConfiguration = <BuildConfiguration>{
      root: path,
      entrypoints: ['**/*.html'],
      outDir: `${path}/client`,
      config: {
        plugins: [
          viteSparqlLoaderPlugin,
          pagesVitePlugin(finalSsrOptions),
        ],
      },
    }
    super('@kopflos-labs/pages', [buildConfiguration])
    this.buildConfiguration = buildConfiguration
    this.api = api
    this.path = path
    this.pattern = pattern
    this.ssrOptions = finalSsrOptions
  }

  getDevServer({ env, plugins }: Kopflos) {
    return super.getViteDevServer(env, this.getDefaultPlugin(plugins), this.buildConfiguration)
  }

  async deployedResources(env: KopflosEnvironment): Promise<DatasetCore> {
    const { rdf, sh, code, schema } = env.ns
    const kl = env.namespace(env.ns.kl().value)
    const talos = env.namespace('urn:talos:')

    const cwd = path.resolve(env.kopflos.basePath, this.path)

    const dataset = env.dataset()
    const graph = env.clownface({
      dataset,
      graph: kl.Pages,
    })
    env.clownface({ dataset, graph: talos.resources })
      .node(kl.Pages)
      .addOut(talos.action, talos.overwrite)

    this.log.info(`Loading pages from ${cwd}/${this.pattern}`)

    for await (const ssrModule of globIterate(this.pattern, { cwd })) {
      const resourceShape = graph
        .namedNode(kl.Pages.value + '#' + encodeURIComponent(ssrModule))

      this.log.info(`Found page: ${ssrModule}. Generating resource shape: ${resourceShape.value}`)

      const html = ssrModule.replace(/\.\w+$/, '')

      resourceShape
        .addOut(rdf.type, kl.ResourceShape)
        .addOut(kl.api, env.namedNode(this.api))
        .addOut(sh.target, target => {
          target
            .addOut(rdf.type, kl.PatternedTarget)
            .addOut(kl.regex, toPattern(ssrModule))
        })
        .addOut(kl.handler, handler => {
          handler
            .addOut(rdf.type, kl.Handler)
            .addOut(kl.method, 'GET')
            .addList(code.implementedBy, [
              graph.blankNode()
                .addOut(rdf.type, code.EcmaScriptModule)
                .addOut(code.link, graph.namedNode('node:@kopflos-labs/pages/handler.js#default'))
                .addList(code.arguments, [html, ssrModule]),
            ])
        })

      const renderer: Page = (await import(path.join(cwd, ssrModule))).default

      const mainEntity = renderer.parameters?.['schema:mainEntity']
      if (mainEntity) {
        resourceShape
          .addOut(sh.property, property => {
            property
              .addOut(sh.path, schema.mainEntity)
              .addOut(sh.pattern, toPattern(mainEntity))
          })
      }
    }

    return dataset
  }

  async build(env: KopflosEnvironment, plugins: readonly KopflosPlugin[]) {
    await super.build(env, plugins)

    const outdir = resolve(env.kopflos.basePath, env.kopflos.buildDir, this.path, 'server')
    await fs.rm(outdir, {
      recursive: true,
      force: true,
    })
    await esbuild.build({
      bundle: true,
      splitting: true,
      format: 'esm',
      platform: 'node',
      entryPoints: [path.join(env.kopflos.basePath, this.path, this.pattern)],
      outdir,
      plugins: [
        esbuildSparqlLoaderPlugin,
        nodeExternalsPlugin(),
      ],
    })
  }
}
