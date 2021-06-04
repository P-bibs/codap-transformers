import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput, useAttributes } from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import {
  ExpressionEditor,
  CodapFlowTextInput,
  TransformationSubmitButtons,
  ContextSelector,
  CollectionSelector,
} from "../ui-components";
import { CodapEvalError } from "../utils/codapPhone/error";

interface BuildColumnProps {
  setErrMsg: (s: string | null) => void;
}

export function BuildColumn({ setErrMsg }: BuildColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
  const [collectionName, collectionNameChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [expression, expressionChange] = useState<string>("");
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
      return [built, `Build Column of ${ctxtTitle(context)}`];
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

      <p>Collection to Add To</p>
      <CollectionSelector
        context={inputDataCtxt}
        value={collectionName}
        onChange={collectionNameChange}
      />

      <p>Name of New Attribute</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
      />

      <p>Formula for Attribute Values</p>
      <ExpressionEditor
        onChange={expressionChange}
        attributeNames={attributes.map((a) => a.name)}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
