// Generated from src/grammar/PropertyPath.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
	ATN,
	ATNDeserializer, DecisionState, DFA, FailedPredicateException,
	RecognitionException, NoViableAltException, BailErrorStrategy,
	Parser, ParserATNSimulator,
	RuleContext, ParserRuleContext, PredictionMode, PredictionContextCache,
	TerminalNode, RuleNode,
	Token, TokenStream,
	Interval, IntervalSet
} from 'antlr4';
import PropertyPathListener from "./PropertyPathListener.js";
import PropertyPathVisitor from "./PropertyPathVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class PropertyPathParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly T__6 = 7;
	public static readonly T__7 = 8;
	public static readonly T__8 = 9;
	public static readonly T__9 = 10;
	public static readonly IRIREF = 11;
	public static readonly PNAME_NS = 12;
	public static readonly PNAME_LN = 13;
	public static readonly PN_CHARS_BASE = 14;
	public static readonly PN_CHARS_U = 15;
	public static readonly PN_CHARS = 16;
	public static readonly PN_PREFIX = 17;
	public static readonly PN_LOCAL = 18;
	public static readonly LANGTAG = 19;
	public static readonly HEX = 20;
	public static readonly PLX = 21;
	public static readonly PERCENT = 22;
	public static readonly INTEGER = 23;
	public static readonly DECIMAL = 24;
	public static readonly DOUBLE = 25;
	public static readonly INTEGER_POSITIVE = 26;
	public static readonly INTEGER_NEGATIVE = 27;
	public static readonly DECIMAL_POSITIVE = 28;
	public static readonly DECIMAL_NEGATIVE = 29;
	public static readonly DOUBLE_POSITIVE = 30;
	public static readonly DOUBLE_NEGATIVE = 31;
	public static readonly EXPONENT = 32;
	public static readonly STRING_LITERAL1 = 33;
	public static readonly STRING_LITERAL2 = 34;
	public static readonly STRING_LITERAL_LONG1 = 35;
	public static readonly STRING_LITERAL_LONG2 = 36;
	public static readonly PN_LOCAL_ESC = 37;
	public static readonly ECHAR = 38;
	public static readonly NIL = 39;
	public static readonly ANON = 40;
	public static readonly WS = 41;
	public static override readonly EOF = Token.EOF;
	public static readonly RULE_path = 0;
	public static readonly RULE_pathAlternative = 1;
	public static readonly RULE_pathSequence = 2;
	public static readonly RULE_pathElt = 3;
	public static readonly RULE_pathEltOrInverse = 4;
	public static readonly RULE_pathMod = 5;
	public static readonly RULE_pathPrimary = 6;
	public static readonly RULE_pathNegatedPropertySet = 7;
	public static readonly RULE_pathOneInPropertySet = 8;
	public static readonly RULE_iri = 9;
	public static readonly RULE_prefixedName = 10;
	public static readonly literalNames: (string | null)[] = [ null, "'|'", 
                                                            "'/'", "'^'", 
                                                            "'?'", "'*'", 
                                                            "'+'", "'a'", 
                                                            "'!'", "'('", 
                                                            "')'" ];
	public static readonly symbolicNames: (string | null)[] = [ null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, null, 
                                                             null, "IRIREF", 
                                                             "PNAME_NS", 
                                                             "PNAME_LN", 
                                                             "PN_CHARS_BASE", 
                                                             "PN_CHARS_U", 
                                                             "PN_CHARS", 
                                                             "PN_PREFIX", 
                                                             "PN_LOCAL", 
                                                             "LANGTAG", 
                                                             "HEX", "PLX", 
                                                             "PERCENT", 
                                                             "INTEGER", 
                                                             "DECIMAL", 
                                                             "DOUBLE", "INTEGER_POSITIVE", 
                                                             "INTEGER_NEGATIVE", 
                                                             "DECIMAL_POSITIVE", 
                                                             "DECIMAL_NEGATIVE", 
                                                             "DOUBLE_POSITIVE", 
                                                             "DOUBLE_NEGATIVE", 
                                                             "EXPONENT", 
                                                             "STRING_LITERAL1", 
                                                             "STRING_LITERAL2", 
                                                             "STRING_LITERAL_LONG1", 
                                                             "STRING_LITERAL_LONG2", 
                                                             "PN_LOCAL_ESC", 
                                                             "ECHAR", "NIL", 
                                                             "ANON", "WS" ];
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"path", "pathAlternative", "pathSequence", "pathElt", "pathEltOrInverse", 
		"pathMod", "pathPrimary", "pathNegatedPropertySet", "pathOneInPropertySet", 
		"iri", "prefixedName",
	];
	public get grammarFileName(): string { return "PropertyPath.g4"; }
	public get literalNames(): (string | null)[] { return PropertyPathParser.literalNames; }
	public get symbolicNames(): (string | null)[] { return PropertyPathParser.symbolicNames; }
	public get ruleNames(): string[] { return PropertyPathParser.ruleNames; }
	public get serializedATN(): number[] { return PropertyPathParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(this, PropertyPathParser._ATN, PropertyPathParser.DecisionsToDFA, new PredictionContextCache());
	}
	// @RuleVersion(0)
	public path(): PathContext {
		let localctx: PathContext = new PathContext(this, this._ctx, this.state);
		this.enterRule(localctx, 0, PropertyPathParser.RULE_path);
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 22;
			this.pathAlternative();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathAlternative(): PathAlternativeContext {
		let localctx: PathAlternativeContext = new PathAlternativeContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, PropertyPathParser.RULE_pathAlternative);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 24;
			this.pathSequence();
			this.state = 29;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===1) {
				{
				{
				this.state = 25;
				this.match(PropertyPathParser.T__0);
				this.state = 26;
				this.pathSequence();
				}
				}
				this.state = 31;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathSequence(): PathSequenceContext {
		let localctx: PathSequenceContext = new PathSequenceContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, PropertyPathParser.RULE_pathSequence);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 32;
			this.pathEltOrInverse();
			this.state = 37;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===2) {
				{
				{
				this.state = 33;
				this.match(PropertyPathParser.T__1);
				this.state = 34;
				this.pathEltOrInverse();
				}
				}
				this.state = 39;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathElt(): PathEltContext {
		let localctx: PathEltContext = new PathEltContext(this, this._ctx, this.state);
		this.enterRule(localctx, 6, PropertyPathParser.RULE_pathElt);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 40;
			this.pathPrimary();
			this.state = 42;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 112) !== 0)) {
				{
				this.state = 41;
				this.pathMod();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathEltOrInverse(): PathEltOrInverseContext {
		let localctx: PathEltOrInverseContext = new PathEltOrInverseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 8, PropertyPathParser.RULE_pathEltOrInverse);
		try {
			this.state = 47;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 7:
			case 8:
			case 9:
			case 11:
			case 12:
			case 13:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 44;
				this.pathElt();
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 45;
				this.match(PropertyPathParser.T__2);
				this.state = 46;
				this.pathElt();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathMod(): PathModContext {
		let localctx: PathModContext = new PathModContext(this, this._ctx, this.state);
		this.enterRule(localctx, 10, PropertyPathParser.RULE_pathMod);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 49;
			_la = this._input.LA(1);
			if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 112) !== 0))) {
			this._errHandler.recoverInline(this);
			}
			else {
				this._errHandler.reportMatch(this);
			    this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathPrimary(): PathPrimaryContext {
		let localctx: PathPrimaryContext = new PathPrimaryContext(this, this._ctx, this.state);
		this.enterRule(localctx, 12, PropertyPathParser.RULE_pathPrimary);
		try {
			this.state = 59;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 11:
			case 12:
			case 13:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 51;
				this.iri();
				}
				break;
			case 7:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 52;
				this.match(PropertyPathParser.T__6);
				}
				break;
			case 8:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 53;
				this.match(PropertyPathParser.T__7);
				this.state = 54;
				this.pathNegatedPropertySet();
				}
				break;
			case 9:
				this.enterOuterAlt(localctx, 4);
				{
				this.state = 55;
				this.match(PropertyPathParser.T__8);
				this.state = 56;
				this.path();
				this.state = 57;
				this.match(PropertyPathParser.T__9);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathNegatedPropertySet(): PathNegatedPropertySetContext {
		let localctx: PathNegatedPropertySetContext = new PathNegatedPropertySetContext(this, this._ctx, this.state);
		this.enterRule(localctx, 14, PropertyPathParser.RULE_pathNegatedPropertySet);
		let _la: number;
		try {
			this.state = 74;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 3:
			case 7:
			case 11:
			case 12:
			case 13:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 61;
				this.pathOneInPropertySet();
				}
				break;
			case 9:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 62;
				this.match(PropertyPathParser.T__8);
				this.state = 71;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 14472) !== 0)) {
					{
					this.state = 63;
					this.pathOneInPropertySet();
					this.state = 68;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===1) {
						{
						{
						this.state = 64;
						this.match(PropertyPathParser.T__0);
						this.state = 65;
						this.pathOneInPropertySet();
						}
						}
						this.state = 70;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					}
				}

				this.state = 73;
				this.match(PropertyPathParser.T__9);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public pathOneInPropertySet(): PathOneInPropertySetContext {
		let localctx: PathOneInPropertySetContext = new PathOneInPropertySetContext(this, this._ctx, this.state);
		this.enterRule(localctx, 16, PropertyPathParser.RULE_pathOneInPropertySet);
		try {
			this.state = 83;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 11:
			case 12:
			case 13:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 76;
				this.iri();
				}
				break;
			case 7:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 77;
				this.match(PropertyPathParser.T__6);
				}
				break;
			case 3:
				this.enterOuterAlt(localctx, 3);
				{
				this.state = 78;
				this.match(PropertyPathParser.T__2);
				this.state = 81;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case 11:
				case 12:
				case 13:
					{
					this.state = 79;
					this.iri();
					}
					break;
				case 7:
					{
					this.state = 80;
					this.match(PropertyPathParser.T__6);
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public iri(): IriContext {
		let localctx: IriContext = new IriContext(this, this._ctx, this.state);
		this.enterRule(localctx, 18, PropertyPathParser.RULE_iri);
		try {
			this.state = 87;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 11:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 85;
				this.match(PropertyPathParser.IRIREF);
				}
				break;
			case 12:
			case 13:
				this.enterOuterAlt(localctx, 2);
				{
				this.state = 86;
				this.prefixedName();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public prefixedName(): PrefixedNameContext {
		let localctx: PrefixedNameContext = new PrefixedNameContext(this, this._ctx, this.state);
		this.enterRule(localctx, 20, PropertyPathParser.RULE_prefixedName);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 89;
			_la = this._input.LA(1);
			if(!(_la===12 || _la===13)) {
			this._errHandler.recoverInline(this);
			}
			else {
				this._errHandler.reportMatch(this);
			    this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}

	public static readonly _serializedATN: number[] = [4,1,41,92,2,0,7,0,2,
	1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,
	10,7,10,1,0,1,0,1,1,1,1,1,1,5,1,28,8,1,10,1,12,1,31,9,1,1,2,1,2,1,2,5,2,
	36,8,2,10,2,12,2,39,9,2,1,3,1,3,3,3,43,8,3,1,4,1,4,1,4,3,4,48,8,4,1,5,1,
	5,1,6,1,6,1,6,1,6,1,6,1,6,1,6,1,6,3,6,60,8,6,1,7,1,7,1,7,1,7,1,7,5,7,67,
	8,7,10,7,12,7,70,9,7,3,7,72,8,7,1,7,3,7,75,8,7,1,8,1,8,1,8,1,8,1,8,3,8,
	82,8,8,3,8,84,8,8,1,9,1,9,3,9,88,8,9,1,10,1,10,1,10,0,0,11,0,2,4,6,8,10,
	12,14,16,18,20,0,2,1,0,4,6,1,0,12,13,94,0,22,1,0,0,0,2,24,1,0,0,0,4,32,
	1,0,0,0,6,40,1,0,0,0,8,47,1,0,0,0,10,49,1,0,0,0,12,59,1,0,0,0,14,74,1,0,
	0,0,16,83,1,0,0,0,18,87,1,0,0,0,20,89,1,0,0,0,22,23,3,2,1,0,23,1,1,0,0,
	0,24,29,3,4,2,0,25,26,5,1,0,0,26,28,3,4,2,0,27,25,1,0,0,0,28,31,1,0,0,0,
	29,27,1,0,0,0,29,30,1,0,0,0,30,3,1,0,0,0,31,29,1,0,0,0,32,37,3,8,4,0,33,
	34,5,2,0,0,34,36,3,8,4,0,35,33,1,0,0,0,36,39,1,0,0,0,37,35,1,0,0,0,37,38,
	1,0,0,0,38,5,1,0,0,0,39,37,1,0,0,0,40,42,3,12,6,0,41,43,3,10,5,0,42,41,
	1,0,0,0,42,43,1,0,0,0,43,7,1,0,0,0,44,48,3,6,3,0,45,46,5,3,0,0,46,48,3,
	6,3,0,47,44,1,0,0,0,47,45,1,0,0,0,48,9,1,0,0,0,49,50,7,0,0,0,50,11,1,0,
	0,0,51,60,3,18,9,0,52,60,5,7,0,0,53,54,5,8,0,0,54,60,3,14,7,0,55,56,5,9,
	0,0,56,57,3,0,0,0,57,58,5,10,0,0,58,60,1,0,0,0,59,51,1,0,0,0,59,52,1,0,
	0,0,59,53,1,0,0,0,59,55,1,0,0,0,60,13,1,0,0,0,61,75,3,16,8,0,62,71,5,9,
	0,0,63,68,3,16,8,0,64,65,5,1,0,0,65,67,3,16,8,0,66,64,1,0,0,0,67,70,1,0,
	0,0,68,66,1,0,0,0,68,69,1,0,0,0,69,72,1,0,0,0,70,68,1,0,0,0,71,63,1,0,0,
	0,71,72,1,0,0,0,72,73,1,0,0,0,73,75,5,10,0,0,74,61,1,0,0,0,74,62,1,0,0,
	0,75,15,1,0,0,0,76,84,3,18,9,0,77,84,5,7,0,0,78,81,5,3,0,0,79,82,3,18,9,
	0,80,82,5,7,0,0,81,79,1,0,0,0,81,80,1,0,0,0,82,84,1,0,0,0,83,76,1,0,0,0,
	83,77,1,0,0,0,83,78,1,0,0,0,84,17,1,0,0,0,85,88,5,11,0,0,86,88,3,20,10,
	0,87,85,1,0,0,0,87,86,1,0,0,0,88,19,1,0,0,0,89,90,7,1,0,0,90,21,1,0,0,0,
	11,29,37,42,47,59,68,71,74,81,83,87];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!PropertyPathParser.__ATN) {
			PropertyPathParser.__ATN = new ATNDeserializer().deserialize(PropertyPathParser._serializedATN);
		}

		return PropertyPathParser.__ATN;
	}


	static DecisionsToDFA = PropertyPathParser._ATN.decisionToState.map( (ds: DecisionState, index: number) => new DFA(ds, index) );

}

export class PathContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathAlternative(): PathAlternativeContext {
		return this.getTypedRuleContext(PathAlternativeContext, 0) as PathAlternativeContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_path;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPath) {
	 		listener.enterPath(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPath) {
	 		listener.exitPath(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPath) {
			return visitor.visitPath(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathAlternativeContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathSequence_list(): PathSequenceContext[] {
		return this.getTypedRuleContexts(PathSequenceContext) as PathSequenceContext[];
	}
	public pathSequence(i: number): PathSequenceContext {
		return this.getTypedRuleContext(PathSequenceContext, i) as PathSequenceContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathAlternative;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathAlternative) {
	 		listener.enterPathAlternative(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathAlternative) {
	 		listener.exitPathAlternative(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathAlternative) {
			return visitor.visitPathAlternative(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathSequenceContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathEltOrInverse_list(): PathEltOrInverseContext[] {
		return this.getTypedRuleContexts(PathEltOrInverseContext) as PathEltOrInverseContext[];
	}
	public pathEltOrInverse(i: number): PathEltOrInverseContext {
		return this.getTypedRuleContext(PathEltOrInverseContext, i) as PathEltOrInverseContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathSequence;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathSequence) {
	 		listener.enterPathSequence(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathSequence) {
	 		listener.exitPathSequence(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathSequence) {
			return visitor.visitPathSequence(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathEltContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathPrimary(): PathPrimaryContext {
		return this.getTypedRuleContext(PathPrimaryContext, 0) as PathPrimaryContext;
	}
	public pathMod(): PathModContext {
		return this.getTypedRuleContext(PathModContext, 0) as PathModContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathElt;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathElt) {
	 		listener.enterPathElt(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathElt) {
	 		listener.exitPathElt(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathElt) {
			return visitor.visitPathElt(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathEltOrInverseContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathElt(): PathEltContext {
		return this.getTypedRuleContext(PathEltContext, 0) as PathEltContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathEltOrInverse;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathEltOrInverse) {
	 		listener.enterPathEltOrInverse(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathEltOrInverse) {
	 		listener.exitPathEltOrInverse(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathEltOrInverse) {
			return visitor.visitPathEltOrInverse(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathModContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathMod;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathMod) {
	 		listener.enterPathMod(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathMod) {
	 		listener.exitPathMod(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathMod) {
			return visitor.visitPathMod(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathPrimaryContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public iri(): IriContext {
		return this.getTypedRuleContext(IriContext, 0) as IriContext;
	}
	public pathNegatedPropertySet(): PathNegatedPropertySetContext {
		return this.getTypedRuleContext(PathNegatedPropertySetContext, 0) as PathNegatedPropertySetContext;
	}
	public path(): PathContext {
		return this.getTypedRuleContext(PathContext, 0) as PathContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathPrimary;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathPrimary) {
	 		listener.enterPathPrimary(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathPrimary) {
	 		listener.exitPathPrimary(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathPrimary) {
			return visitor.visitPathPrimary(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathNegatedPropertySetContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public pathOneInPropertySet_list(): PathOneInPropertySetContext[] {
		return this.getTypedRuleContexts(PathOneInPropertySetContext) as PathOneInPropertySetContext[];
	}
	public pathOneInPropertySet(i: number): PathOneInPropertySetContext {
		return this.getTypedRuleContext(PathOneInPropertySetContext, i) as PathOneInPropertySetContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathNegatedPropertySet;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathNegatedPropertySet) {
	 		listener.enterPathNegatedPropertySet(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathNegatedPropertySet) {
	 		listener.exitPathNegatedPropertySet(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathNegatedPropertySet) {
			return visitor.visitPathNegatedPropertySet(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PathOneInPropertySetContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public iri(): IriContext {
		return this.getTypedRuleContext(IriContext, 0) as IriContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_pathOneInPropertySet;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPathOneInPropertySet) {
	 		listener.enterPathOneInPropertySet(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPathOneInPropertySet) {
	 		listener.exitPathOneInPropertySet(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPathOneInPropertySet) {
			return visitor.visitPathOneInPropertySet(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class IriContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public IRIREF(): TerminalNode {
		return this.getToken(PropertyPathParser.IRIREF, 0);
	}
	public prefixedName(): PrefixedNameContext {
		return this.getTypedRuleContext(PrefixedNameContext, 0) as PrefixedNameContext;
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_iri;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterIri) {
	 		listener.enterIri(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitIri) {
	 		listener.exitIri(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitIri) {
			return visitor.visitIri(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PrefixedNameContext extends ParserRuleContext {
	constructor(parser?: PropertyPathParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public PNAME_LN(): TerminalNode {
		return this.getToken(PropertyPathParser.PNAME_LN, 0);
	}
	public PNAME_NS(): TerminalNode {
		return this.getToken(PropertyPathParser.PNAME_NS, 0);
	}
    public get ruleIndex(): number {
    	return PropertyPathParser.RULE_prefixedName;
	}
	public enterRule(listener: PropertyPathListener): void {
	    if(listener.enterPrefixedName) {
	 		listener.enterPrefixedName(this);
		}
	}
	public exitRule(listener: PropertyPathListener): void {
	    if(listener.exitPrefixedName) {
	 		listener.exitPrefixedName(this);
		}
	}
	// @Override
	public accept<Result>(visitor: PropertyPathVisitor<Result>): Result {
		if (visitor.visitPrefixedName) {
			return visitor.visitPrefixedName(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
