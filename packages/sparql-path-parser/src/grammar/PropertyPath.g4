grammar PropertyPath;

path: pathAlternative;
pathAlternative: pathSequence ( '|' pathSequence )*;
pathSequence: pathEltOrInverse ('/' pathEltOrInverse)*;
pathElt: pathPrimary pathMod?;
pathEltOrInverse: pathElt | '^' pathElt;
pathMod: '?' | '*' | '+';
pathPrimary
    : iri
    | 'a'
    | '!' pathNegatedPropertySet
    | '(' path ')'
    ;
pathNegatedPropertySet
    : pathOneInPropertySet
    | '(' ( pathOneInPropertySet ( '|' pathOneInPropertySet )* )? ')'
    ;
pathOneInPropertySet: iri | 'a' | '^' (iri | 'a');




iri: IRIREF | prefixedName;
prefixedName: PNAME_LN | PNAME_NS;


IRIREF: '<' ( ~[<>"{}|^`\u005C\u0000-\u0020] )* '>';
PNAME_NS: PN_PREFIX? ':';
PNAME_LN: PNAME_NS PN_LOCAL;
PN_CHARS_BASE
    : [A-Z]
    | [a-z]
    | [\u00C0-\u00D6]
    | [\u00D8-\u00F6]
    | [\u00F8-\u02FF]
    | [\u0370-\u037D]
    | [\u037F-\u1FFF]
    | [\u200C-\u200D]
    | [\u2070-\u218F]
    | [\u2C00-\u2FEF]
    | [\u3001-\uD7FF]
    | [\uF900-\uFDCF]
    | [\uFDF0-\uFFFD]
    //TODO | [#x10000-#xEFFFF]
    ;
PN_CHARS_U: PN_CHARS_BASE | '_';
PN_CHARS
    : PN_CHARS_U
    | '-'
    | [0-9]
    | '\u00B7'
    | [\u0300-\u036F]
    | [\u203F-\u2040]
    ;
PN_PREFIX: PN_CHARS_BASE ((PN_CHARS | '.')* PN_CHARS)?;
PN_LOCAL: (PN_CHARS_U | ':' | [0-9] | PLX) ( (PN_CHARS | '.' | ':' | PLX)* (PN_CHARS | ':' | PLX) )?;
LANGTAG: '@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*;
HEX: [0-9] | [A-F] | [a-f];
PLX: PERCENT | PN_LOCAL_ESC;
PERCENT: '%' HEX HEX;
INTEGER: [0-9]+;
DECIMAL: [0-9]* '.' [0-9]+;
DOUBLE
    : ([0-9]+ '.' [0-9]* EXPONENT)
    | ('.' [0-9]+ EXPONENT)
    | ([0-9]+ EXPONENT)
    ;
INTEGER_POSITIVE: '+' INTEGER;
INTEGER_NEGATIVE: '-' INTEGER;
DECIMAL_POSITIVE: '+' DECIMAL;
DECIMAL_NEGATIVE: '-' DECIMAL;
DOUBLE_POSITIVE: '+' DOUBLE;
DOUBLE_NEGATIVE: '-' DOUBLE;
EXPONENT: [eE] [+-]? [0-9]+;
STRING_LITERAL1: '\u0027' (~[\u0027\u005C\u000A\u000D] | ECHAR)* '\u0027';
STRING_LITERAL2: '"' (~[\u0022\u005C\u000A\u000D] | ECHAR)* '"';
STRING_LITERAL_LONG1: '\u0027\u0027\u0027' (('\u0027' | '\u0027\u0027')? (~[\u0027\u005C] | ECHAR))* '\u0027\u0027\u0027';
STRING_LITERAL_LONG2: '"""' (('\u0022' | '\u0022\u0022')? (~[\u0022\u005C] | ECHAR))* '"""';
// \u0027 = apostrophe = '
// \u005C = backslash = \
PN_LOCAL_ESC: '\u005C' ('_' | '~' | '.' | '-' | '!' | '$' | '&' | '\u0027' | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%');
ECHAR: '\u005C' [tbnrf\u005C\u0027"];
NIL: '(' WS? ')';
ANON: '[' WS? ']';
WS: (' '|'\t'|'\n'|'\r')+ -> skip;
