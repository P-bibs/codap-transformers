import { Token } from "./lex";
import { Ast } from "./ast";
import {
  PrefixParselet,
  NumberParselet,
  IdentifierParselet,
  OperatorParselet,
  InfixParselet,
  ParenthesisParselet,
} from "./parselets";

/**
 * Get the binding power for operators
 */
export function getBindingPower(op: Token): number {
  if (op.kind === "DOUBLE_EQUALS") {
    return 10;
  } else if (op.kind === "PLUS" || op.kind === "MINUS") {
    return 20;
  } else if (op.kind === "TIMES" || op.kind === "DIVIDE") {
    return 30;
  } else {
    throw Error("Tried to get binding power for bad token");
  }
}

/**
 * Map tokens to prefix parselets
 */
function prefixParseletMap(tok: Token): PrefixParselet | null {
  if (tok.kind === "NUMBER") {
    return new NumberParselet();
  } else if (tok.kind === "IDENTIFIER") {
    return new IdentifierParselet();
  } else if (tok.kind === "LPAREN") {
    return new ParenthesisParselet();
  } else {
    return null;
  }
}

/**
 * Map tokens to infix parselets
 */
function infixParseletMap(tok: Token): InfixParselet | null {
  if (tok.kind === "PLUS") {
    return new OperatorParselet("+", true);
  } else if (tok.kind === "MINUS") {
    return new OperatorParselet("-", true);
  } else if (tok.kind === "TIMES") {
    return new OperatorParselet("*", true);
  } else if (tok.kind === "DIVIDE") {
    return new OperatorParselet("/", true);
  } else if (tok.kind === "DOUBLE_EQUALS") {
    return new OperatorParselet("==", true);
  } else {
    return null;
  }
}

/**
 * Parse a list of tokens into an AST. The list of tokens is not mutated.
 */
export function parse(tokens: Token[]): Ast {
  // immutable reverse (so that tokens.pop() works as expected)
  tokens = tokens.slice().reverse();
  let l = parseExpr(tokens, 0);
  console.log(l);
  return l;
}

export function parseExpr(tokens: Token[], currentBindingPower: number): Ast {
  // Pop a token
  let initialToken = tokens.pop();
  if (!initialToken) {
    throw new Error("Unexpected end of token stream");
  }

  // Find the parselet that corresponds to the intial token
  let initialParselet = prefixParseletMap(initialToken);
  if (!initialParselet) {
    throw new Error(`Unexpected token: ${initialToken}`);
  }

  // Invoke the initial parselet
  let leftNode = initialParselet.parse(tokens, initialToken);

  while (true) {
    // Peek the next token
    let nextToken: Token = tokens[tokens.length - 1];
    if (!nextToken) {
      // If the tokens list is empty then break
      break;
    }

    // See if this token is valid as an infix operator
    let infixParselet = infixParseletMap(nextToken);
    if (infixParselet !== null) {
      // Only continue if this token binds more tightly than current token
      if (getBindingPower(nextToken) <= currentBindingPower) {
        break;
      }

      // @ts-ignore
      nextToken = tokens.pop();
      leftNode = infixParselet.parse(tokens, leftNode, nextToken);

      continue;
    }

    // TODO: this is where we could add postfix operators if we wanted. It would look like:
    // let postfixParselet = postfixParseletMap(nextToken);
    // if (postfixParselet) {
    //   ...
    //   continue;
    // }

    break;
  }
  return leftNode;
}
