import React, { ReactElement, useState } from "react";
import { getContextAndDataSet, evalExpression } from "../utils/codapPhone";
import { CodapEvalError } from "../utils/codapPhone/error";
import { useInput, useAttributes } from "../utils/hooks";
import { ContextSelector, ExpressionEditor } from "../ui-components";

interface EvalProps {
  setErrMsg: (s: string | null) => void;
}

export function Eval({ setErrMsg }: EvalProps): ReactElement {
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
      <p>Table to Filter</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>How to Filter</p>
      <ExpressionEditor
        onChange={pgrmChange}
        attributeNames={attributes.map((a) => a.name)}
      />

      <br />
      <button onClick={evalExpr}>Eval</button>

      <p>Result</p>
      <p>{result}</p>
    </>
  );
}
