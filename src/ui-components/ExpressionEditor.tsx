import React, { ReactElement } from "react";
import { UnControlled as CodeMirrorElement } from "react17-codemirror2";

// This is required for defineSimpleMode
import "codemirror/addon/mode/simple.js";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";

// Adapted from codap/apps/dg/formula/formula.js
const firstChar =
  "A-Za-z_\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE";
const otherChars = "0-9" + firstChar;

const functionRegExp = new RegExp(`[${firstChar}][${otherChars}]*(?=\\()`);
const identifierRegExp = new RegExp(`[${firstChar}][${otherChars}]*`);

// Adapted from codap/apps/dg/formula/codapFormulaMode.js
// Docs for defineSimpleMode: https://codemirror.net/demo/simplemode.html
CodeMirror.defineSimpleMode("codapFormula", {
  start: [
    {
      regex: /(?:"(?:[^\\]|\\.)*?(?:"|$))|(?:'(?:[^\\]|\\.)*?(?:'|$))/,
      token: "string",
    },
    { regex: /true|false/, token: "atom" },
    {
      regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
      token: "number",
    },
    { regex: /[-+/*=<>!^]+/, token: "operator" },
    { regex: functionRegExp, token: "function" },
    { regex: identifierRegExp, token: "variable" },
    { regex: /(?:`(?:[^\\]|\\.)*?(?:`|$))/, token: "variable" },
  ],
  meta: {
    dontIndentStates: ["start"],
  },
});

interface ExpressionEditorProps {
  onChange: (value: string) => void;
}

export default function ExpressionEditor({
  onChange,
}: ExpressionEditorProps): ReactElement {
  return (
    <CodeMirrorElement
      options={{
        mode: "codapFormula",
      }}
      onChange={(editor, data, value) => {
        onChange(value);
      }}
    />
  );
}
