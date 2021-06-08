import React, { ReactElement, useState } from "react";
import { getContextAndDataSet, evalExpression } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { ContextSelector, ExpressionEditor } from "../ui-components";
import { TransformationProps } from "./types";

// eslint-disable-next-line
export interface EvalSaveData {}

interface EvalProps extends TransformationProps {
  saveData?: EvalSaveData;
}
export function Eval({ setErrMsg, saveData }: EvalProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [transformPgrm, pgrmChange] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const attributes = useAttributes(inputDataCtxt);

  async function evalExpr() {
    setResult("");

    if (inputDataCtxt === null) {
      setErrMsg("Please select data context");
      return;
    }
    const { dataset } = await getContextAndDataSet(inputDataCtxt);

    if (dataset.records.length < 5) {
      setErrMsg("Please pick a dataset with at least 5 elements");
    }
    try {
      const evalResult = await evalExpression(
        transformPgrm,
        dataset.records.slice(0, 5)
      );
      setResult(JSON.stringify(evalResult));
    } catch (e) {
      setErrMsg(e.message);
    }
  }

  return (
    <>
      <p>Table to Evaluate On</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Formula to Evaluate</p>
      <ExpressionEditor
        value={transformPgrm}
        onChange={pgrmChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <button onClick={evalExpr}>Eval</button>

      <p>Result</p>
      <p>{result}</p>
    </>
  );
}
