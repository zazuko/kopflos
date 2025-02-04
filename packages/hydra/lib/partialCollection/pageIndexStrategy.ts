import { isGraphPointer, isLiteral } from 'is-graph-pointer'
import { hydra } from '@tpluscode/rdf-ns-builders'
import error from 'http-errors'
import { tryParse } from '../number.js'
import type { PartialCollectionStrategy } from './index.js'

export default <PartialCollectionStrategy> {
  isApplicableTo(collection) {
    return isGraphPointer(collection
      .out(hydra.search)
      .out(hydra.mapping)
      .has(hydra.property, hydra.pageIndex))
  },
  getLimitOffset({ collection, query }) {
    const pageIndexParam = query.out(hydra.pageIndex)
    const limitParam = collection.out(hydra.limit)

    const pageIndex = isLiteral(pageIndexParam)
      ? tryParse(pageIndexParam, new error.BadRequest('Invalid hydra:pageIndex'))
      : 0
    const limit = tryParse(limitParam, new Error('Invalid hydra:limit'))

    return {
      limit,
      offset: pageIndex * limit,
    }
  },
  viewLinksTemplateParams: {
    first({ query }) {
      return query
        .deleteOut(hydra.pageIndex)
        .addOut(hydra.pageIndex, 1)
    },
    last({ query, collection, totalItems }) {
      const currentPageIndex = tryParse(query.out(hydra.limit), tryParse(collection.out(hydra.limit)))
      const lastPageIndex = Math.floor(totalItems / currentPageIndex) - 1
      return query
        .deleteOut(hydra.pageIndex)
        .addOut(hydra.pageIndex, lastPageIndex)
    },
    next({ query, collection, totalItems }) {
      const currentPageIndex = tryParse(query.out(hydra.limit), tryParse(collection.out(hydra.limit)))
      const pageIndex = tryParse(query.out(hydra.pageIndex), 1)
      const lastPageIndex = Math.floor(totalItems / currentPageIndex) - 1
      if (pageIndex >= lastPageIndex) {
        return undefined
      }

      return query
        .deleteOut(hydra.pageIndex)
        .addOut(hydra.pageIndex, pageIndex + 1)
    },
    previous({ query }) {
      const pageIndex = tryParse(query.out(hydra.pageIndex), 1)
      if (pageIndex === 0) {
        return undefined
      }

      return query
        .deleteOut(hydra.pageIndex)
        .addOut(hydra.pageIndex, pageIndex - 1)
    },
  },
}
