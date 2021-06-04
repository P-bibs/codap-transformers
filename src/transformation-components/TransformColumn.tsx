import React, { useState, useCallback, ReactElement } from "react";
import { useInput, useAttributes } from "../utils/hooks";
import { transformColumn } from "../transformations/transformColumn";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  ExpressionEditor,
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { useContextUpdateListenerWithFlowEffect } from "../utils/hooks";
import { getContextAndDataSet } from "../utils/codapPhone";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { CodapEvalError } from "../utils/codapPhone/error";

export interface TransformColumnSaveData {
  attributeName: string;
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

  const [attributeName, attributeNameChange] = useState<string | null>(
    saveData !== undefined ? saveData.attributeName : ""
  );
  const [expression, expressionChange] = useState<string>(
    saveData !== undefined ? saveData.expression : ""
  );
  const [lastContextName, setLastContextName] = useState<string | null>(null);
  const attributes = useAttributes(inputDataCtxt);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(
    async (doUpdate: boolean) => {
      setErrMsg("");

      if (inputDataCtxt === null) {
        setErrMsg("Please choose a valid data context to transform.");
        return;
      }
      if (attributeName === null) {
        setErrMsg("Please select an attribute to transform");
        return;
      }
      if (expression === "") {
        setErrMsg("Please enter a non-empty expression to transform with");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const transformed = await transformColumn(
          dataset,
          attributeName,
          expression
        );
        await applyNewDataSet(
          transformed,
          `Transform Column of ${ctxtTitle(context)}`,
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
      <AttributeSelector
        onChange={attributeNameChange}
        value={attributeName}
        context={inputDataCtxt}
      />

      <p>How to Transform Column</p>
      <ExpressionEditor
        value={expression}
        onChange={expressionChange}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributeName,
            expression,
          })}
        />
      )}
    </>
  );
}
