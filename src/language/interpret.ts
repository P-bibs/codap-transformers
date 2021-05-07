import { Ast, Operator, Value } from "./ast";

/**
 * An environment is a map from strings to Values
 */
export type Env = {
  [indexer: string]: Value;
};
const INITIAL_ENVIRONMENT: Env = {
  true: { kind: "Bool", content: true },
  false: { kind: "Bool", content: false },
};

/**
 * Interpret an AST to get a value. The second argument is optional
 * and allows you to pre-fill values in the environment (like maybe row values)
 */
export function interpret(expr: Ast, env?: Env): Value {
  if (!env) {
    env = {};
  }
  // Add in our initial symbols
  env = { ...env, ...INITIAL_ENVIRONMENT };
  return interpretExpr(expr, env);
}

function interpretExpr(expr: Ast, env: Env): Value {
  switch (expr.kind) {
    case "Binop":
      return interpretBinop(expr.op, expr.op1, expr.op2, env);
    case "Identifier":
      return env[expr.content];
    case "Number":
      return { kind: "Num", content: expr.content };
  }
}

function interpretBinop(op: Operator, op1: Ast, op2: Ast, env: Env): Value {
  let val1 = interpretExpr(op1, env);
  let val2 = interpretExpr(op2, env);

  if (op === "==" || op === "!=") {
    switch (op) {
      case "==":
        return { kind: "Bool", content: val1.content === val2.content };
      case "!=":
        return { kind: "Bool", content: val1.content !== val2.content };
    }
  } else if (op === "||" || op === "&&") {
    if (val1.kind !== "Bool" || val2.kind !== "Bool") {
      throw new Error(
        "Tried logical binary operation with non-boolean operands"
      );
    }
    switch (op) {
      case "||":
        return { kind: "Bool", content: val1.content || val2.content };
      case "&&":
        return { kind: "Bool", content: val1.content && val2.content };
    }
  } else {
    if (val1.kind !== "Num" || val2.kind !== "Num") {
      throw new Error(
        "Tried arithmetic binary operation with non-number operands"
      );
    }
    switch (op) {
      case "+":
        return { kind: "Num", content: val1.content + val2.content };
      case "-":
        return { kind: "Num", content: val1.content - val2.content };
      case "*":
        return { kind: "Num", content: val1.content * val2.content };
      case "/":
        return { kind: "Num", content: val1.content / val2.content };
      case ">":
        return { kind: "Bool", content: val1.content > val2.content };
      case ">=":
        return { kind: "Bool", content: val1.content >= val2.content };
    }
  }
}
