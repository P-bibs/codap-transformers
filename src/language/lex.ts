export type Token =
  | { kind: "IDENTIFIER"; content: string }
  | { kind: "NUMBER"; content: number }
  | { kind: "LPAREN" }
  | { kind: "RPAREN" }
  | { kind: "DOUBLE_EQUALS" }
  | { kind: "PLUS" }
  | { kind: "MINUS" }
  | { kind: "TIMES" }
  | { kind: "DIVIDE" };

/**
 * A list of tuples representing a regex to use to search for a token
 * and a function to use to turn the resulting regex match string into a token
 */
let regexTable: Array<[RegExp, null | ((s: string) => Token)]> = [
  [/^[a-z][a-zA-Z0-9]*/, (s) => ({ kind: "IDENTIFIER", content: s })],
  [/^[0-9]+/, (s) => ({ kind: "NUMBER", content: parseInt(s) })],
  [/^\(/, () => ({ kind: "LPAREN" })],
  [/^\)/, () => ({ kind: "RPAREN" })],
  [/^==/, () => ({ kind: "DOUBLE_EQUALS" })],
  [/^\+/, () => ({ kind: "PLUS" })],
  [/^-/, () => ({ kind: "MINUS" })],
  [/^\*/, () => ({ kind: "TIMES" })],
  [/^\//, () => ({ kind: "DIVIDE" })],
  [/^[ \n\t]+/, null],
];

/**
 * Tokenize a string
 */
export function lex(source: string): Token[] {
  let buf = source;
  let tokens: Token[] = [];

  outerLoop: while (buf.length > 0) {
    for (const [regex, callback] of regexTable) {
      let match = regex.exec(buf);
      if (match) {
        let matchedString = match[0];
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
    throw new Error("Found invalid token while lexing");
  }

  return tokens;
}
