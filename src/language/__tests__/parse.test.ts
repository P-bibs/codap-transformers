import { parse } from "../parse";
import { Token } from "../lex";

test("parses simple binary operation", () => {
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: { kind: "Number", content: 2 },
  });
});

test("parses equality correctly", () => {
  // 1 + 2 * 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "DOUBLE_EQUAL" },
    { kind: "NUMBER", content: 2 },
    { kind: "TIMES" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "==",
    op1: { kind: "Number", content: 1 },
    op2: {
      kind: "Binop",
      op: "*",
      op1: { kind: "Number", content: 2 },
      op2: { kind: "Number", content: 3 },
    },
  });
});

test("parses associativity correctly", () => {
  // 1 - 2 - 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "MINUS" },
    { kind: "NUMBER", content: 2 },
    { kind: "MINUS" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "-",
    op1: {
      kind: "Binop",
      op: "-",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  });
});

test("parses precedence correctly", () => {
  // 1 + 2 * 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
    { kind: "TIMES" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "+",
    op1: { kind: "Number", content: 1 },
    op2: {
      kind: "Binop",
      op: "*",
      op1: { kind: "Number", content: 2 },
      op2: { kind: "Number", content: 3 },
    },
  });
});

test("parses parentheses correctly", () => {
  // (1 + 2) * 3
  const tokens: Token[] = [
    { kind: "LPAREN" },
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
    { kind: "RPAREN" },
    { kind: "TIMES" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "*",
    op1: {
      kind: "Binop",
      op: "+",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  });
});

test("parses inequalities correctly", () => {
  // 1 > 2 >= 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "GREATER" },
    { kind: "NUMBER", content: 2 },
    { kind: "GREATER_EQUAL" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: ">=",
    op1: {
      kind: "Binop",
      op: ">",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  });
});

test("parses not equals correctly", () => {
  // 1 != 2 + 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "NOT_EQUAL" },
    { kind: "NUMBER", content: 2 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "!=",
    op1: { kind: "Number", content: 1 },
    op2: {
      kind: "Binop",
      op: "+",
      op1: { kind: "Number", content: 2 },
      op2: { kind: "Number", content: 3 },
    },
  });
});

test("parses boolean operations correctly", () => {
  // 1 && 2 || 3
  const tokens: Token[] = [
    { kind: "NUMBER", content: 1 },
    { kind: "L_AND" },
    { kind: "NUMBER", content: 2 },
    { kind: "L_OR" },
    { kind: "NUMBER", content: 3 },
  ];
  expect(parse(tokens)).toStrictEqual({
    kind: "Binop",
    op: "||",
    op1: {
      kind: "Binop",
      op: "&&",
      op1: { kind: "Number", content: 1 },
      op2: { kind: "Number", content: 2 },
    },
    op2: { kind: "Number", content: 3 },
  });
});

test("parses identifers correctly", () => {
  // x
  const tokens: Token[] = [{ kind: "IDENTIFIER", content: "x" }];
  expect(parse(tokens)).toStrictEqual({
    kind: "Identifier",
    content: "x",
  });
});
