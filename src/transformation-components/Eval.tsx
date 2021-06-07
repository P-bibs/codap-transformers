import React, { ReactElement, useState } from "react";
import { getContextAndDataSet, evalExpression } from "../utils/codapPhone";
import { CodapEvalError } from "../utils/codapPhone/error";
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
      if (e instanceof CodapEvalError) {
        setErrMsg(e.error);
      } else {
        setErrMsg(e.toString());
      }
    }
  }

  return (
    <>
      <h3>Table to Evaluate On</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Formula to Evaluate</h3>
      <ExpressionEditor
        value={transformPgrm}
        onChange={pgrmChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <button onClick={evalExpr}>Eval</button>

      <h3>Result</h3>
      <h3>{result}</h3>
    </>
  );
}
