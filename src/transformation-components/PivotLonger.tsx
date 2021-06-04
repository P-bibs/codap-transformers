import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { pivotLonger } from "../transformations/pivot";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  MultiAttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
  CodapFlowTextInput,
} from "../ui-components";
import { TransformationProps } from "./types";

export interface PivotLongerSaveData {
  attributes: string[];
  namesTo: string;
  valuesTo: string;
}

interface PivotLongerProps extends TransformationProps {
  saveData?: PivotLongerSaveData;
}

export function PivotLonger({
  setErrMsg,
  saveData,
}: PivotLongerProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, setAttributes] = useState<string[]>(
    saveData !== undefined ? saveData.attributes : []
  );
  const [namesTo, namesToChange] = useInput<string, HTMLInputElement>(
    saveData !== undefined ? saveData.namesTo : "",
    () => setErrMsg(null)
  );
  const [valuesTo, valuesToChange] = useInput<string, HTMLInputElement>(
    saveData !== undefined ? saveData.valuesTo : "",
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
      if (attributes.length === 0) {
        setErrMsg("Please choose at least one attribute to pivot on");
        return;
      }
      if (namesTo === "") {
        setErrMsg("Please choose a non-empty name for the Names To attribute");
        return;
      }
      if (valuesTo === "") {
        setErrMsg("Please choose a non-empty name for the Values To attribute");
        return;
      }

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const pivoted = pivotLonger(dataset, attributes, namesTo, valuesTo);
        await applyNewDataSet(
          pivoted,
          `Pivot Longer of ${ctxtTitle(context)}`,
          doUpdate,
          lastContextName,
          setLastContextName,
          setErrMsg
        );
      } catch (e) {
        setErrMsg(e.message);
      }
    },
    [inputDataCtxt, attributes, setErrMsg, lastContextName, namesTo, valuesTo]
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
      <p>Table to Pivot</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <p>Attributes to Pivot</p>
      <MultiAttributeSelector
        context={inputDataCtxt}
        onChange={setAttributes}
      />

      <p>Names To</p>
      <CodapFlowTextInput value={namesTo} onChange={namesToChange} />

      <p>Values To</p>
      <CodapFlowTextInput value={valuesTo} onChange={valuesToChange} />

      <br />
      <TransformationSubmitButtons
        onCreate={() => transform(false)}
        onUpdate={() => transform(true)}
        updateDisabled={!lastContextName}
      />
    </>
  );
}
