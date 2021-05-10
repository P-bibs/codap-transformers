import { interpret, Env } from "./interpret";
import { lex } from "./lex";
import { parse } from "./parse";

export function evaluate(source: string, env?: Env) {
  return interpret(parse(lex(source)), env);
}
