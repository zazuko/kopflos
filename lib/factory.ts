import type { Environment } from '@rdfjs/environment/Environment.js'
import type { DataFactory, DatasetCoreFactory, Quad, DatasetCore } from '@rdfjs/types'
import type { TermSetFactory } from '@rdfjs/term-set/Factory.js'
import type ClownfaceFactory from 'clownface/Factory.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type FsUtilsFactory from '@zazuko/rdf-utils-fs/Factory.js'
import type { NamespaceFactory } from '@rdfjs/namespace/Factory.js'

type Factory<D extends DatasetCore = DatasetCore> = Environment<DatasetCoreFactory<Quad, Quad, D> | DataFactory | TermSetFactory | ClownfaceFactory | NsBuildersFactory | FsUtilsFactory | NamespaceFactory>
export type ExtractDataset<This> = This extends DatasetCoreFactory ? ReturnType<This["dataset"]> : never;

export default Factory
