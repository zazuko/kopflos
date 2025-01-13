import { isGraphPointer } from 'is-graph-pointer'
import { hydra } from '@tpluscode/rdf-ns-builders'
import error from 'http-errors'
import { tryParse } from '../number.js'
import type { PartialCollectionStrategy } from './index.js'

export default <PartialCollectionStrategy>{
  isApplicableTo(collection) {
    const hasLimitParam = isGraphPointer(collection
      .out(hydra.search)
      .out(hydra.mapping)
      .has(hydra.property, hydra.limit))
    const hasOffsetParam = isGraphPointer(collection
      .out(hydra.search)
      .out(hydra.mapping)
      .has(hydra.property, hydra.offset))

    return hasLimitParam && hasOffsetParam
  },
  getLimitOffset({ query }) {
    let limit: number | undefined
    let offset: number | undefined
    const limitParam = query.out(hydra.limit)
    const offsetParam = query.out(hydra.offset)

    if (isGraphPointer(limitParam)) {
      limit = tryParse(limitParam, new error.BadRequest('Invalid hydra:limit'))
    }
    if (isGraphPointer(offsetParam)) {
      offset = tryParse(offsetParam, new error.BadRequest('Invalid hydra:offset'))
    }

    return {
      limit,
      offset,
    }
  },
  viewLinksTemplateParams: {
    first({ query }) {
      return query
        .deleteOut(hydra.offset)
        .addOut(hydra.offset, 0)
    },
    last({ query, collection, totalItems }) {
      const limit = tryParse(query.out(hydra.limit), tryParse(collection.out(hydra.limit)))
      const lastOffset = Math.floor(totalItems / limit) * limit
      return query
        .deleteOut(hydra.offset)
        .addOut(hydra.offset, lastOffset)
    },
    next({ query, collection }) {
      const offset = tryParse(query.out(hydra.offset), 0)
      const limit = tryParse(query.out(hydra.limit), tryParse(collection.out(hydra.limit)))
      return query
        .deleteOut(hydra.offset)
        .addOut(hydra.offset, offset + limit)
    },
    previous({ query, collection }) {
      const offset = tryParse(query.out(hydra.offset), 0)
      const limit = tryParse(query.out(hydra.limit), tryParse(collection.out(hydra.limit)))
      return query
        .deleteOut(hydra.offset)
        .addOut(hydra.offset, offset - limit)
    },
  },
}
