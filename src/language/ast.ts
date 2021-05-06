export type Ast =
  | { kind: "Binop"; op: Operator; op1: Ast; op2: Ast }
  | { kind: "Identifier"; content: string }
  | { kind: "Number"; content: number };

export type Operator = "+" | "-" | "*" | "/" | "==";

export type Value =
  | { kind: "Num"; content: number }
  | { kind: "Bool"; content: boolean };
