import rdf from '@zazuko/env-node'

type Properties = 'api' | 'resourceLoader' | 'handler' | 'method' | 'config'
type Classes = 'Config' | 'Api' | 'ResourceShape' | 'Handler'
type Shorthands = 'DescribeLoader' | 'OwnGraphLoader'

export interface KopflosTerms extends Record<Properties | Classes | Shorthands, never>{
}

export const kl = rdf.namespace<keyof KopflosTerms>('https://kopflos.described.at/')
