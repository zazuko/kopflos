import type { MultiPointer } from 'clownface'
import { isLiteral } from 'is-graph-pointer'

export function tryParse<E extends Error | number = Error | number>(pointer: MultiPointer, err?: E) {
  if (!isLiteral(pointer)) {
    if (typeof err === 'number') {
      return err
    }

    throw err || new Error('Expected a literal')
  }

  try {
    return parseInt(pointer.value, 10)
  } catch {
    throw err || new Error('Expected a literal')
  }
}
