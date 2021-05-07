import { lex } from "../lex";
import { parse } from "../parse";
import { interpret } from "../interpret";

test("correctly processes complex arithmetic expression", () => {
  let source = "2 * (3 + 4) + 5 * 6";
  expect(interpret(parse(lex(source)))).toStrictEqual({
    kind: "Num",
    content: 44,
  });
});

test("correctly processes complex boolean expression (positive)", () => {
  let source = "1 + 2 * 3 == 1 + 3 * 2";
  expect(interpret(parse(lex(source)))).toStrictEqual({
    kind: "Bool",
    content: true,
  });
});

test("correctly processes complex boolean expression (negative)", () => {
  let source = "1 + 2 * 3 == 3 + 2 * 1";
  expect(interpret(parse(lex(source)))).toStrictEqual({
    kind: "Bool",
    content: false,
  });
});

test("correctly processes boolean expressions", () => {
  let source = "1 == 1 and 2 == 3 or 1 != 0";
  expect(interpret(parse(lex(source)))).toStrictEqual({
    kind: "Bool",
    content: true,
  });
});

test("correctly processes inequality expressions", () => {
  let source = "1 > 2 and 1 >= 1";
  expect(interpret(parse(lex(source)))).toStrictEqual({
    kind: "Bool",
    content: true,
  });
});
