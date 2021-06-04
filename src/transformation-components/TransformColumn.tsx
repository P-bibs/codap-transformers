import React, { useState, useCallback, ReactElement } from "react";
import { useInput } from "../utils/hooks";
import { transformColumn } from "../transformations/transformColumn";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  CodapFlowTextArea,
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { useContextUpdateListenerWithFlowEffect } from "../utils/hooks";
import { getContextAndDataSet } from "../utils/codapPhone";
import { TransformationProps } from "./types";

export interface TransformColumnSaveData {
  attributeName: string;
  collectionName: string;
  expression: string;
}

interface TransformColumnProps extends TransformationProps {
  saveData?: TransformColumnSaveData;
}
export function TransformColumn({
  setErrMsg,
  saveData,
}: TransformColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.attributeName : "", () =>
    setErrMsg(null)
  );
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    saveData !== undefined ? saveData.expression : "",
    () => setErrMsg(null)
  );
  const [lastContextName, setLastContextName] = useState<string | null>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }
      if (attributeName === "") {
        setErrMsg("Please enter a non-empty attribute name to transform");
        return;
      }
      if (expression === "") {
        setErrMsg("Please enter a non-empty expression to transform with");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const transformed = transformColumn(dataset, attributeName, expression);
        await applyNewDataSet(
          transformed,
          `Transform Column of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributeName, expression, lastContextName, setErrMsg]
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
      <p>Table to TransformColumn</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attribute to Transform</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
      />

      <p>How to Transform Column</p>
      <CodapFlowTextArea
        value={expression}
        onChange={expressionChange}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
