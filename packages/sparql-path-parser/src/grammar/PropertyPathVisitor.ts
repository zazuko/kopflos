// Generated from src/grammar/PropertyPath.g4 by ANTLR 4.13.2

import {ParseTreeVisitor} from 'antlr4';


import { PathContext } from "./PropertyPathParser.js";
import { PathAlternativeContext } from "./PropertyPathParser.js";
import { PathSequenceContext } from "./PropertyPathParser.js";
import { PathEltContext } from "./PropertyPathParser.js";
import { PathEltOrInverseContext } from "./PropertyPathParser.js";
import { PathModContext } from "./PropertyPathParser.js";
import { PathPrimaryContext } from "./PropertyPathParser.js";
import { PathNegatedPropertySetContext } from "./PropertyPathParser.js";
import { PathOneInPropertySetContext } from "./PropertyPathParser.js";
import { IriContext } from "./PropertyPathParser.js";
import { PrefixedNameContext } from "./PropertyPathParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PropertyPathParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export default class PropertyPathVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `PropertyPathParser.path`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPath?: (ctx: PathContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathAlternative`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathAlternative?: (ctx: PathAlternativeContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathSequence`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathSequence?: (ctx: PathSequenceContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathElt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathElt?: (ctx: PathEltContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathEltOrInverse`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathEltOrInverse?: (ctx: PathEltOrInverseContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathMod`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathMod?: (ctx: PathModContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathPrimary`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathPrimary?: (ctx: PathPrimaryContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathNegatedPropertySet`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathNegatedPropertySet?: (ctx: PathNegatedPropertySetContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.pathOneInPropertySet`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPathOneInPropertySet?: (ctx: PathOneInPropertySetContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.iri`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitIri?: (ctx: IriContext) => Result;
	/**
	 * Visit a parse tree produced by `PropertyPathParser.prefixedName`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPrefixedName?: (ctx: PrefixedNameContext) => Result;
}

