import * as Path from 'clownface-shacl-path'
import { rdf } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import namespace, {NamespaceBuilder} from '@rdfjs/namespace'
import { expand } from '@zazuko/prefixes'
import type * as ParserContext from './grammar/PropertyPathParser.js'
import PropertyPathVisitor from './grammar/PropertyPathVisitor.js'
import {isRel} from 'is-relative-uri';

export default class extends PropertyPathVisitor<Path.ShaclPropertyPath> {
  private ns: NamespaceBuilder = namespace('')

  constructor(baseIRI?: string) {
    super();

    if (baseIRI) {
      this.ns = namespace(baseIRI)
    }
  }

  visitPath = (ctx: ParserContext.PathContext): Path.ShaclPropertyPath => {
    return ctx.pathAlternative().accept(this)
  }

  visitPathSequence = (ctx: ParserContext.PathSequenceContext): Path.ShaclPropertyPath => {
    const children = ctx.pathEltOrInverse_list()

    if (children.length === 1) {
      return children[0].accept(this)
    }

    return new Path.SequencePath(children.flatMap(p => p.accept(this)))
  }

  visitPathEltOrInverse = (ctx: ParserContext.PathEltOrInverseContext): Path.ShaclPropertyPath => {
    if (ctx.getChildCount() === 2) {
      return new Path.InversePath(ctx.pathElt().accept(this))
    }

    return ctx.pathElt().accept(this)
  }

  visitPathAlternative = (ctx: ParserContext.PathAlternativeContext): Path.ShaclPropertyPath => {
    const children = ctx.pathSequence_list()

    if (children.length === 1) {
      return children[0].accept(this)
    }

    return new Path.AlternativePath(children.flatMap(p => p.accept(this)))
  }

  visitPathElt = (ctx: ParserContext.PathEltContext): Path.ShaclPropertyPath => {
    const pathPrimary = ctx.pathPrimary().accept(this)
    const pathMod = ctx.pathMod()

    if (!pathMod) {
      return pathPrimary
    }

    switch (pathMod.getText()) {
      case '?':
        return new Path.ZeroOrOnePath(pathPrimary)
      case '*':
        return new Path.ZeroOrMorePath(pathPrimary)
      case '+':
        return new Path.OneOrMorePath(pathPrimary)
    }

    throw new Error('Unexpected pathMod')
  }

  visitPathPrimary = (ctx: ParserContext.PathPrimaryContext): Path.ShaclPropertyPath => {
    if (ctx.iri()) {
      return ctx.iri().accept(this)
    }
    if (ctx.getText() === 'a') {
      return new Path.PredicatePath(rdf.type)
    }
    if (ctx.path()) {
      return ctx.path().accept(this)
    }
    if (ctx.pathNegatedPropertySet()) {
      return ctx.pathNegatedPropertySet().accept(this)
    }

    throw new Error('Unexpected pathPrimary')
  }

  visitPathNegatedPropertySet = (ctx: ParserContext.PathNegatedPropertySetContext): Path.ShaclPropertyPath => {
    const pathsInPropertySet = ctx.pathOneInPropertySet_list().map(p => p.accept(this)) as Array<Path.PredicatePath | Path.InversePath<Path.PredicatePath>>

    return new Path.NegatedPropertySet(pathsInPropertySet)
  }

  visitPathOneInPropertySet = (ctx: ParserContext.PathOneInPropertySetContext): Path.ShaclPropertyPath => {
    const inverse = ctx.getText().includes('^')
    let predicate

    if (ctx.iri()) {
      predicate = ctx.iri().accept(this)
    } else {
      predicate = new Path.PredicatePath(rdf.type)
    }

    return inverse ? new Path.InversePath(predicate) : predicate
  }

  visitIri = (ctx: ParserContext.IriContext): Path.ShaclPropertyPath => {
    const iriref = ctx.IRIREF()?.getText()
    if (iriref) {
      const iri = iriref.slice(1, -1)
      if (isRel(iri)) {
        return new Path.PredicatePath(this.ns(iri))
      }

      return new Path.PredicatePath($rdf.namedNode(iri))
    }

    return new Path.PredicatePath($rdf.namedNode(expand(ctx.prefixedName().getText())))
  }
}
