import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { pivotLonger } from "../transformations/pivot";
import { applyNewDataSet } from "./util";
import {
  CodapFlowTextArea,
  TransformationSubmitButtons,
  ContextSelector,
  CodapFlowTextInput,
} from "../ui-components";

interface PivotLongerProps {
  setErrMsg: (s: string | null) => void;
}

export function PivotLonger({ setErrMsg }: PivotLongerProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributes, attributesChange] = useInput<string, HTMLTextAreaElement>(
    "",
    () => setErrMsg(null)
  );
  const [namesTo, namesToChange] = useInput<string, HTMLInputElement>("", () =>
    setErrMsg(null)
  );
  const [valuesTo, valuesToChange] = useInput<string, HTMLInputElement>(
    "",
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
      if (attributes === "") {
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

      const dataset = await getDataSet(inputDataCtxt);

      // extract attribute names from user's text
      const attributeNames = attributes.split("\n").map((s) => s.trim());

      try {
        const pivoted = pivotLonger(dataset, attributeNames, namesTo, valuesTo);
        await applyNewDataSet(
          pivoted,
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

      <p>Attributes to Pivot (1 per line)</p>
      <CodapFlowTextArea value={attributes} onChange={attributesChange} />

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
