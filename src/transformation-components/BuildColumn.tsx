import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import {
  ExpressionEditor,
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
  CollectionSelector,
} from "../ui-components";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { CodapEvalError } from "../utils/codapPhone/error";

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
    HTMLSelectElement
  >(saveData !== undefined ? saveData.collectionName : "", () =>
    setErrMsg(null)
  );
  const [expression, setExpression] = useState<string>(
    saveData !== undefined ? saveData.expression : ""
  );

  const attributes = useAttributes(inputDataCtxt);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to transform.");
      return;
    }
    if (collectionName === null) {
      setErrMsg("Please select a collection to add to");
      return;
    }
    if (attributeName === "") {
      setErrMsg("Please enter a non-empty name for the new attribute");
      return;
    }
    if (expression === "") {
      setErrMsg("Please enter a non-empty expression");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const built = await buildColumn(
        dataset,
        attributeName,
        collectionName,
        expression
      );
      return [built, `Build Column of ${readableName(context)}`];
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
  }, [inputDataCtxt, attributeName, collectionName, expression, setErrMsg]);

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
      <CollectionSelector
        context={inputDataCtxt}
        value={collectionName}
        onChange={collectionNameChange}
        disabled={saveData !== undefined}
      />

      <p>Formula for Attribute Values</p>
      <ExpressionEditor
        value={expression}
        onChange={setExpression}
        attributeNames={attributes.map((a) => a.name)}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
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
