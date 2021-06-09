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
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface SortSaveData {
  keyExpression: string;
}

interface SortProps extends TransformationProps {
  saveData?: SortSaveData;
}

export function Sort({
  setErrMsg,
  saveData,
  errorDisplay,
}: SortProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useState<string>(
    saveData !== undefined ? saveData.keyExpression : ""
  );
  const attributes = useAttributes(inputDataCtxt);

  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }
    if (keyExpression === "") {
      setErrMsg("Please enter a non-empty key expression");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const result = await sort(dataset, keyExpression);
      return [result, `Sort of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, keyExpression]);

  return (
    <>
      <h3>Table to sort</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Key expression</h3>
      <ExpressionEditor
        value={keyExpression}
        onChange={keyExpressionChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            keyExpression,
          })}
        />
      )}
    </>
  );
}
