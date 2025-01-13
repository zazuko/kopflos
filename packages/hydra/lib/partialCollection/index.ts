import type { GraphPointer } from 'clownface'

interface LimitOffset {
  limit: number
  offset: number
}

interface GetLimitOffset {
  collection: GraphPointer
  query: GraphPointer
}

interface ViewLinksTemplateParams {
  collection: GraphPointer
  query: GraphPointer
  totalItems: number
}

export interface PrepareExpansionModel {
  (arg: ViewLinksTemplateParams): GraphPointer
}

export interface PartialCollectionStrategy {
  isApplicableTo(collection: GraphPointer): boolean
  getLimitOffset(arg: GetLimitOffset): LimitOffset
  viewLinksTemplateParams: {
    first: PrepareExpansionModel
    last: PrepareExpansionModel
    next: PrepareExpansionModel
    previous: PrepareExpansionModel
  }
}
