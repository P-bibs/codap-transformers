import React, { ReactElement, useCallback } from "react";
import { UnControlled as CodeMirrorElement } from "react17-codemirror2";

// This is required for defineSimpleMode
import "codemirror/addon/mode/simple.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/lib/codemirror.css";
import CodeMirror, { HintFunction } from "codemirror";
import "./ExpressionEditor.css";

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
  attributeNames?: string[];
}

function isMatchableChar(m: string) {
  return m !== " ";
}

/**
 * A word with its position
 */
interface Word {
  start: number;
  end: number;
  word: string;
}

function getCurrentWord(cm: CodeMirror.Editor): Word {
  const cursor = cm.getCursor();
  const end = cursor.ch;
  let start = end;

  const currentLine = cm.getLine(cursor.line);
  while (start && isMatchableChar(currentLine.charAt(start - 1))) --start;

  return {
    start,
    end,
    word: currentLine.slice(start, end),
  };
}

export default function ExpressionEditor({
  onChange,
  attributeNames = [],
}: ExpressionEditorProps): ReactElement {
  const codapFormulaHints: HintFunction = useCallback(
    (cm) => {
      const cursor = cm.getCursor();
      const { start, end, word } = getCurrentWord(cm);

      // Don't complete if word is empty string
      const completionList =
        word === "" ? [] : attributeNames.filter((w) => w.startsWith(word));

      return {
        list: completionList,
        from: CodeMirror.Pos(cursor.line, start),
        to: CodeMirror.Pos(cursor.line, end),
      };
    },
    [attributeNames]
  );

  return (
    <CodeMirrorElement
      options={{
        mode: "codapFormula",
        hintOptions: {
          completeSingle: false,
          hint: codapFormulaHints,
        },
      }}
      onInputRead={(editor) => {
        editor.showHint();
      }}
      onChange={(editor, data, value) => {
        onChange(value);
      }}
    />
  );
}
