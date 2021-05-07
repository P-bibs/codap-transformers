import { interpret, Env } from "./interpret";
import { Ast } from "./ast";

test("interprets simple binary operation", () => {
  let ast: Ast = {
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: { kind: "Number", content: 2 },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Num", content: 3 });
});

test("interprets equality correctly", () => {
  // 1 == 2 * 3
  let ast: Ast = {
    kind: "Binop",
    op: "==",
    op1: { kind: "Number", content: 1 },
    op2: {
      kind: "Binop",
      op: "*",
      op1: { kind: "Number", content: 2 },
      op2: { kind: "Number", content: 3 },
    },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Bool", content: false });
});

test("interprets associativity correctly", () => {
  // 1 - 2 - 3
  let ast: Ast = {
    kind: "Binop",
    op: "-",
    op1: {
      kind: "Binop",
      op: "-",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Num", content: -4 });
});

test("interprets precedence correctly", () => {
  // 1 + 2 * 3
  let ast: Ast = {
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: {
      kind: "Binop",
      op: "*",
      op1: { kind: "Number", content: 2 },
      op2: { kind: "Number", content: 3 },
    },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Num", content: 7 });
});

test("interprets parentheses correctly", () => {
  // (1 + 2) * 3
  let ast: Ast = {
    kind: "Binop",
    op: "*",
    op1: {
      kind: "Binop",
      op: "+",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Num", content: 9 });
});

test("looks up identifiers in environment", () => {
  // 1 + x
  let ast: Ast = {
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: { kind: "Identifier", content: "x" },
  };
  let env: Env = {
    x: { kind: "Num", content: 1 },
  };
  expect(interpret(ast, env)).toStrictEqual({ kind: "Num", content: 2 });
});
