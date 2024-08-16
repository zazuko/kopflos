/* eslint-disable @typescript-eslint/no-explicit-any */
import chai, { expect } from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import rdf from '@zazuko/env-node'

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Chai {
    interface Assertion {
      canonical: Assertion
    }
  }
}

chai.use(jestSnapshotPlugin())

chai.use((_chai, utils) => {
  const toMatchSnapshot = (chai.Assertion.prototype as any).toMatchSnapshot

  utils.addMethod(chai.Assertion.prototype, 'toMatchSnapshot', function (this: Chai.Assertion, ...args: any[]) {
    const obj = (this as any)._obj

    if (utils.flag(this, 'dataset-canonical')) {
      // Custom behavior for dataset
      expect(rdf.dataset.toCanonical(obj)).toMatchSnapshot(...args)
    } else {
      // Original behavior
      toMatchSnapshot.apply(this, args)
    }
  })

  utils.addProperty(chai.Assertion.prototype, 'canonical', function (this: Chai.Assertion) {
    utils.flag(this, 'dataset-canonical', true)
  })
})
