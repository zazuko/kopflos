import ConstraintComponent, {
  type Parameters,
  type PropertyShape,
} from '@hydrofoil/shape-to-query/model/constraint/ConstraintComponent.js'
// eslint-disable-next-line import/no-unresolved
import { kl } from '@kopflos-cms/core/ns.js'
import { hydra } from '@tpluscode/rdf-ns-builders'
import type { NamedNode, Term } from '@rdfjs/types'
import type { BgpPattern } from 'sparqljs'

type MemberAssertion = {
  subject: NamedNode
  property: NamedNode
  object: undefined
} | {
  subject: NamedNode
  object: NamedNode
  property: undefined
} | {
  property: NamedNode
  object: NamedNode
  subject: undefined
}

export class HydraMemberAssertionConstraint extends ConstraintComponent {
  constructor(private readonly memberAssertion: MemberAssertion) {
    super(kl['hydra#MemberAssertionConstraintComponent'])
  }

  static * fromShape(shape: PropertyShape) {
    const memberAssertions = shape.get(hydra.memberAssertion) || []

    for (const value of memberAssertions) {
      if (!('pointer' in value)) {
        continue
      }

      const subject = value.pointer.out(hydra.subject).term
      const property = value.pointer.out(hydra.property).term
      const object = value.pointer.out(hydra.object).term

      const memberAssertion: Record<'subject' | 'property' | 'object', Term | undefined> = { subject, property, object }
      if (HydraMemberAssertionConstraint.isValid(memberAssertion)) {
        yield new HydraMemberAssertionConstraint(memberAssertion)
      }
    }
  }

  static isValid(arg: MemberAssertion | Record<'subject' | 'property' | 'object', Term | undefined>): arg is MemberAssertion {
    return (arg.subject === undefined && arg.property?.termType === 'NamedNode' && arg.object?.termType === 'NamedNode') ||
      (arg.subject?.termType === 'NamedNode' && arg.property === undefined && arg.object?.termType === 'NamedNode') ||
      (arg.subject?.termType === 'NamedNode' && arg.property?.termType === 'NamedNode' && arg.object === undefined)
  }

  buildPropertyShapePatterns({ focusNode }: Parameters): BgpPattern[] {
    return [{
      type: 'bgp',
      triples: [{
        subject: this.memberAssertion.subject || focusNode,
        predicate: this.memberAssertion.property || focusNode,
        object: this.memberAssertion.object || focusNode,
      }],
    }]
  }
}
