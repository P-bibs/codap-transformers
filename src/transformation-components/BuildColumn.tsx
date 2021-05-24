import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useDataContexts,
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { buildColumn } from "../transformations/buildColumn";
import { applyNewDataSet } from "./util";
import {
  CodapFlowTextArea,
  CodapFlowTextInput,
  CodapFlowSelect,
  TransformationSubmitButtons,
} from "../ui-components";

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
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const dataContexts = useDataContexts();

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

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const built = buildColumn(
          dataset,
          attributeName,
          collectionName,
          expression
        );
        await applyNewDataSet(
          built,
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
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: dataContext.title,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />
      <p>Name of New Attribute</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
      />

      <p>Collection to Add To</p>
      <CodapFlowTextInput
        value={collectionName}
        onChange={collectionNameChange}
      />

      <p>Formula for Attribute Values</p>
      <CodapFlowTextArea value={expression} onChange={expressionChange} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
