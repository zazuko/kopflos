// Generated from src/grammar/PropertyPath.g4 by ANTLR 4.13.2

import {ParseTreeListener} from "antlr4";


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
 * This interface defines a complete listener for a parse tree produced by
 * `PropertyPathParser`.
 */
export default class PropertyPathListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `PropertyPathParser.path`.
	 * @param ctx the parse tree
	 */
	enterPath?: (ctx: PathContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.path`.
	 * @param ctx the parse tree
	 */
	exitPath?: (ctx: PathContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathAlternative`.
	 * @param ctx the parse tree
	 */
	enterPathAlternative?: (ctx: PathAlternativeContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathAlternative`.
	 * @param ctx the parse tree
	 */
	exitPathAlternative?: (ctx: PathAlternativeContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathSequence`.
	 * @param ctx the parse tree
	 */
	enterPathSequence?: (ctx: PathSequenceContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathSequence`.
	 * @param ctx the parse tree
	 */
	exitPathSequence?: (ctx: PathSequenceContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathElt`.
	 * @param ctx the parse tree
	 */
	enterPathElt?: (ctx: PathEltContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathElt`.
	 * @param ctx the parse tree
	 */
	exitPathElt?: (ctx: PathEltContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathEltOrInverse`.
	 * @param ctx the parse tree
	 */
	enterPathEltOrInverse?: (ctx: PathEltOrInverseContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathEltOrInverse`.
	 * @param ctx the parse tree
	 */
	exitPathEltOrInverse?: (ctx: PathEltOrInverseContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathMod`.
	 * @param ctx the parse tree
	 */
	enterPathMod?: (ctx: PathModContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathMod`.
	 * @param ctx the parse tree
	 */
	exitPathMod?: (ctx: PathModContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathPrimary`.
	 * @param ctx the parse tree
	 */
	enterPathPrimary?: (ctx: PathPrimaryContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathPrimary`.
	 * @param ctx the parse tree
	 */
	exitPathPrimary?: (ctx: PathPrimaryContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathNegatedPropertySet`.
	 * @param ctx the parse tree
	 */
	enterPathNegatedPropertySet?: (ctx: PathNegatedPropertySetContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathNegatedPropertySet`.
	 * @param ctx the parse tree
	 */
	exitPathNegatedPropertySet?: (ctx: PathNegatedPropertySetContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.pathOneInPropertySet`.
	 * @param ctx the parse tree
	 */
	enterPathOneInPropertySet?: (ctx: PathOneInPropertySetContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.pathOneInPropertySet`.
	 * @param ctx the parse tree
	 */
	exitPathOneInPropertySet?: (ctx: PathOneInPropertySetContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.iri`.
	 * @param ctx the parse tree
	 */
	enterIri?: (ctx: IriContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.iri`.
	 * @param ctx the parse tree
	 */
	exitIri?: (ctx: IriContext) => void;
	/**
	 * Enter a parse tree produced by `PropertyPathParser.prefixedName`.
	 * @param ctx the parse tree
	 */
	enterPrefixedName?: (ctx: PrefixedNameContext) => void;
	/**
	 * Exit a parse tree produced by `PropertyPathParser.prefixedName`.
	 * @param ctx the parse tree
	 */
	exitPrefixedName?: (ctx: PrefixedNameContext) => void;
}

