import React, { useState, useCallback, ReactElement } from "react";
import { useInput } from "../utils/hooks";
import { transformColumn } from "../transformations/transformColumn";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import {
  CodapFlowTextArea,
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { getContextAndDataSet } from "../utils/codapPhone";
import { CodapEvalError } from "../utils/codapPhone/error";

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
  const [attributeName, attributeNameChange] = useState<string | null>(null);
  const [expression, expressionChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
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

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const transformed = await transformColumn(
        dataset,
        attributeName,
        expression
      );
      const newName = `Transform Column of ${ctxtTitle(context)}`;
      return [transformed, newName];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform);
    } catch (e) {
      if (e instanceof CodapEvalError) {
        setErrMsg(e.error);
      } else {
        setErrMsg(e.toString());
      }
    }
  }, [inputDataCtxt, attributeName, expression, setErrMsg]);

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
      <CodapFlowTextArea value={expression} onChange={expressionChange} />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
