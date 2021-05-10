import { interpret, Env } from "../interpret";
import { Ast } from "../ast";

test("interprets simple binary operation", () => {
  const ast: Ast = {
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: { kind: "Number", content: 2 },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Num", content: 3 });
});

test("interprets equality correctly", () => {
  // 1 = 2 * 3
  const ast: Ast = {
    kind: "Binop",
    op: "=",
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
  const ast: Ast = {
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
  const ast: Ast = {
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
  const ast: Ast = {
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
  const ast: Ast = {
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: { kind: "Identifier", content: "x" },
  };
  const env: Env = {
    x: { kind: "Num", content: 1 },
  };
  expect(interpret(ast, env)).toStrictEqual({ kind: "Num", content: 2 });
});

test("allows boolean literals", () => {
  // true or false
  const ast: Ast = {
    kind: "Binop",
    op: "||",
    op1: { kind: "Identifier", content: "true" },
    op2: { kind: "Identifier", content: "false" },
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Bool", content: true });
});

test("interprets logic correctly", () => {
  const ast: Ast = {
    kind: "Unop",
    op: "not",
    op1: {
      kind: "Binop",
      op: "&&",
      op1: { kind: "Identifier", content: "true" },
      op2: { kind: "Unop", op: "not", op1: {
        kind: "Identifier", content: "false"
      }}
    }
  };
  expect(interpret(ast)).toStrictEqual({ kind: "Bool", content: false });
})
