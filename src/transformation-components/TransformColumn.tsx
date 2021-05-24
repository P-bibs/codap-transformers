import React, { useState, useCallback, ReactElement } from "react";
import { useDataContexts, useInput } from "../utils/hooks";
import { transformColumn } from "../transformations/transformColumn";
import { applyNewDataSet } from "./util";
import {
  CodapFlowTextArea,
  CodapFlowTextInput,
  CodapFlowSelect,
  TransformationSubmitButtons,
} from "../ui-components";
import { useContextUpdateListenerWithFlowEffect } from "../utils/hooks";
import { getDataSet } from "../utils/codapPhone";

interface TransformColumnProps {
  setErrMsg: (s: string | null) => void;
}

export function TransformColumn({
  setErrMsg,
}: TransformColumnProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useInput<
    string,
    HTMLInputElement
  >("", () => setErrMsg(null));
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const dataContexts = useDataContexts();
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

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const transformed = transformColumn(dataset, attributeName, expression);
        await applyNewDataSet(
          transformed,
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
      <CodapFlowSelect
        onChange={inputChange}
        options={dataContexts.map((dataContext) => ({
          value: dataContext.name,
          title: `${dataContext.title} (${dataContext.name})`,
        }))}
        value={inputDataCtxt}
        defaultValue="Select a Data Context"
      />

      <p>Attribute to Transform</p>
      <CodapFlowTextInput
        value={attributeName}
        onChange={attributeNameChange}
      />

      <p>How to Transform Column</p>
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
