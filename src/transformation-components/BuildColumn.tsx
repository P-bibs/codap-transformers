import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
  useAttributes,
} from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";
import { applyNewDataSet, ctxtTitle } from "./util";
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
  const [lastContextName, setLastContextName] = useState<null | string>(null);
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

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const built = await buildColumn(
          dataset,
          attributeName,
          collectionName,
          expression
        );
        const inputTitle = ctxtTitle(context);
        await applyNewDataSet(
          built,
          `Build Column of ${inputTitle}`,
          `A copy of ${inputTitle} with a new attribute (${attributeName}) added to the ${collectionName} collection, whose value is determined by the formula ${expression}`,
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
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
