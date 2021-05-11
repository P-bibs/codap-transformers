import { interpret, Env } from "./interpret";
import { Value } from "./ast";
import { lex } from "./lex";
import { parse } from "./parse";

/**
 * Lex, parse, and interpret a source expression in a given environment.
 * @param source text of expression to evaluate
 * @param env environment in which to evaluate
 * @returns value the expression evaluated to, or throws an error
 */
export function evaluate(source: string, env?: Env): Value {
  return interpret(parse(lex(source)), env);
}
