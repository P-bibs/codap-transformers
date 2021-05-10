export type Token =
  | { kind: "IDENTIFIER"; content: string }
  | { kind: "NUMBER"; content: number }
  | { kind: "STRING"; content: string }
  | { kind: "LPAREN" }
  | { kind: "RPAREN" }
  | { kind: "EQUAL" }
  | { kind: "NOT_EQUAL" }
  | { kind: "GREATER" }
  | { kind: "GREATER_EQUAL" }
  | { kind: "PLUS" }
  | { kind: "MINUS" }
  | { kind: "TIMES" }
  | { kind: "DIVIDE" }
  | { kind: "L_AND" }
  | { kind: "L_OR" }
  | { kind: "L_NOT" };

/**
 * A list of tuples representing a regex to use to search for a token
 * and a function to use to turn the resulting regex match string into a token
 */
const regexTable: Array<[RegExp, null | ((s: string) => Token)]> = [
  [/^-?[0-9]+/, (s) => ({ kind: "NUMBER", content: parseInt(s) })],
  [/^\(/, () => ({ kind: "LPAREN" })],
  [/^\)/, () => ({ kind: "RPAREN" })],
  [/^=/, () => ({ kind: "EQUAL" })],
  [/^!=/, () => ({ kind: "NOT_EQUAL" })],
  [/^>=/, () => ({ kind: "GREATER_EQUAL" })],
  [/^>/, () => ({ kind: "GREATER" })],
  [/^\+/, () => ({ kind: "PLUS" })],
  [/^-/, () => ({ kind: "MINUS" })],
  [/^\*/, () => ({ kind: "TIMES" })],
  [/^\//, () => ({ kind: "DIVIDE" })],
  [/^(and|&&)/, () => ({ kind: "L_AND" })],
  [/^(or|\|\|)/, () => ({ kind: "L_OR" })],
  [/^(not|!)/, () => ({ kind: "L_NOT" })],
  [/^[a-zA-Z][a-zA-Z0-9]*/, (s) => ({ kind: "IDENTIFIER", content: s })],
  [
    /^".*?"/,
    (s) => ({ kind: "STRING", content: s.substring(1, s.length - 1) }),
  ],
  [/^[ \n\t]+/, null],
];

/**
 * Tokenize a string
 */
export function lex(source: string): Token[] {
  let buf = source;
  const tokens: Token[] = [];

  outerLoop: while (buf.length > 0) {
    for (const [regex, callback] of regexTable) {
      const match = regex.exec(buf);
      if (match) {
        const matchedString = match[0];
        // See what kind of match we had
        if (callback === null) {
          // Null means skip this token (whitespace)
        } else {
          // If not null, call the function to make a new token
          tokens.push(callback(matchedString));
        }
        // Move us forward in the source string
        buf = buf.slice(matchedString.length);

        // Jump to next iteration of outerloop
        continue outerLoop;
      }
    }
    // This only gets called if no regex matched
    throw new Error(`Found invalid token while lexing ${buf}`);
  }

  return tokens;
}
