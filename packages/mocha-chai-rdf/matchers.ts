/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Term } from '@rdfjs/types'
import chai from 'chai'
import type { AnyPointer } from 'clownface'
import toNT from '@rdfjs/to-ntriples'

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Chai {
    interface Assertion {
      term: Assertion
    }
  }
}

const plugin: Chai.ChaiPlugin = (_chai, utils) => {
  const Assertion = _chai.Assertion

  Assertion.overwriteMethod('eq', function (_super) {
    return function (this: any, other: Term) {
      if (utils.flag(this, 'rdfjs-term')) {
        const obj: AnyPointer | Term = this._obj

        let term: Term
        if ('terms' in obj) {
          if (!obj.term) {
            return this.assert(
              false,
              'expected a pointer with single term #{exp} but got #{act} terms',
              'expected a pointer with single term not to equal #{exp}',
              toNT(other),
              obj.terms.length,
            )
          }

          return this.assert(
            other.equals(obj.term),
            'expected a pointer to #{exp} but got #{act}',
            'expected a pointer not to equal #{exp}',
            toNT(other),
            toNT(obj.term),
          )
        }

        return this.assert(
          other.equals(obj),
          'expected #{this} to equal #{exp}',
          'expected #{this} not to equal #{exp}',
          toNT(other),
          toNT(obj),
        )
      }

      _super.call(this, other)
    }
  })

  utils.addProperty(chai.Assertion.prototype, 'term', function (this: Chai.Assertion) {
    utils.flag(this, 'rdfjs-term', true)
  })
}

export default plugin
