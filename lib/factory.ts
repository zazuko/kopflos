import type { Environment } from '@rdfjs/environment/Environment.js'
import type{ DataFactory, DatasetCoreFactory, Quad } from '@rdfjs/types'
import type { TermSetFactory } from '@rdfjs/term-set/Factory.js'
import type ClownfaceFactory from 'clownface/Factory.js'
import type NsBuildersFactory from '@tpluscode/rdf-ns-builders'
import type { DatasetExt } from '@zazuko/env'
import type FsUtilsFactory from '@zazuko/rdf-utils-fs/Factory.js'

type Factory<D extends DatasetExt = DatasetExt> = Environment<DatasetCoreFactory<Quad, Quad, D> | DataFactory | TermSetFactory | ClownfaceFactory | NsBuildersFactory | FsUtilsFactory>

export default Factory
