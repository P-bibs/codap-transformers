import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  CodapFlowTextArea,
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface BuildColumnSaveData {
  attributeName: string;
  collectionName: string;
  expression: string;
}

interface BuildColumnProps extends TransformationProps {
  saveData?: BuildColumnSaveData;
}

export function BuildColumn({
  setErrMsg,
  saveData,
}: BuildColumnProps): ReactElement {
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
  const [collectionName, collectionNameChange] = useInput<
    string,
    HTMLInputElement
  >(saveData !== undefined ? saveData.collectionName : "", () =>
    setErrMsg(null)
  );
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    saveData !== undefined ? saveData.expression : "",
    () => setErrMsg(null)
  );

  const [lastContextName, setLastContextName] = useState<null | string>(null);

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
        setErrMsg("Please enter a non-empty name for the new attribute");
        return;
      }
      if (collectionName === "") {
        setErrMsg("Please enter a non-empty collection name to add to");
        return;
      }
      if (expression === "") {
        setErrMsg("Please enter a non-empty expression");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const built = buildColumn(
          dataset,
          attributeName,
          collectionName,
          expression
        );
        await applyNewDataSet(
          built,
          `Build Column of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [
      inputDataCtxt,
      attributeName,
      collectionName,
      expression,
      setErrMsg,
      lastContextName,
    ]
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
      <p>Table to Add Attribute To</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />
      <p>Name of New Attribute</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
        disabled={saveData !== undefined}
      />

      <p>Collection to Add To</p>
      <CodapFlowTextInput
        value={collectionName}
        onChange={collectionNameChange}
        disabled={saveData !== undefined}
      />

      <p>Formula for Attribute Values</p>
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
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributeName,
            collectionName,
            expression,
          })}
        />
      )}
    </>
  );
}
