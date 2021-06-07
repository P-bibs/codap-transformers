import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useContextUpdateListenerWithFlowEffect,
  useInput,
  useAttributes,
} from "../utils/hooks";
import { TransformationProps } from "./types";
import { sort } from "../transformations/sort";
import {
  TransformationSubmitButtons,
  ExpressionEditor,
  ContextSelector,
} from "../ui-components";
import { applyNewDataSet, ctxtTitle } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { CodapEvalError } from "../utils/codapPhone/error";

export interface SortSaveData {
  keyExpression: string;
}

interface SortProps extends TransformationProps {
  saveData?: SortSaveData;
}

export function Sort({ setErrMsg, saveData }: SortProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  const [keyExpression, keyExpressionChange] = useState<string>(
    saveData !== undefined ? saveData.keyExpression : ""
  );
  const [lastContextName, setLastContextName] = useState<null | string>(null);
  const attributes = useAttributes(inputDataCtxt);

  const transform = useCallback(
    async (doUpdate: boolean) => {
      setErrMsg("");

      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }
      if (keyExpression === "") {
        setErrMsg("Please enter a non-empty key expression");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const result = await sort(dataset, keyExpression);
        await applyNewDataSet(
          result,
          `Sort of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        if (e instanceof CodapEvalError) {
          setErrMsg(e.error);
        } else {
          setErrMsg(e.toString());
        }
      }
    },
    [inputDataCtxt, setErrMsg, keyExpression, lastContextName]
  );

  useContextUpdateListenerWithFlowEffect(
    inputDataCtxt,
    lastContextName,
    () => {
      transform(true);
    },
    [transform]
  );

  return (
    <>
      <p>Table to sort</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Key expression</p>
      <ExpressionEditor
        value={keyExpression}
        onChange={keyExpressionChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={true}
      />
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
