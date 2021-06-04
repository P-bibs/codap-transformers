import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ExpressionEditor,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { CodapEvalError } from "../utils/codapPhone/error";

export function Sort({ setErrMsg }: TransformationProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useState<string>("");
  const attributes = useAttributes(inputDataCtxt);

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (keyExpression === "") {
      setErrMsg("Please enter a non-empty key expression");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = await sort(dataset, keyExpression);
      return [result, `Sort of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      if (e instanceof CodapEvalError) {
        setErrMsg(e.error);
      } else {
        setErrMsg(e.toString());
      }
    }
  }, [inputDataCtxt, setErrMsg, keyExpression]);

  return (
    <>
      <p>Table to sort</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Key expression</p>
      <ExpressionEditor
        onChange={keyExpressionChange}
        attributeNames={attributes.map((a) => a.name)}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
