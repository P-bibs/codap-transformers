import React, { useState, useCallback, ReactElement } from "react";
import { getDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { pivotWider } from "../transformations/pivot";
import { applyNewDataSet } from "./util";
import {
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";

interface PivotWiderProps {
  setErrMsg: (s: string | null) => void;
}

export function PivotWider({ setErrMsg }: PivotWiderProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [namesFrom, namesFromOnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [valuesFrom, valuesFromOnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

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
      if (namesFrom === null) {
        setErrMsg("Please choose an attribute to get names from");
        return;
      }
      if (valuesFrom === null) {
        setErrMsg("Please choose an attribute to get values from");
        return;
      }

      const dataset = await getDataSet(inputDataCtxt);

      try {
        const pivoted = pivotWider(dataset, namesFrom, valuesFrom);
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
    [inputDataCtxt, setErrMsg, lastContextName, namesFrom, valuesFrom]
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

      <p>Names From</p>
      <AttributeSelector
        onChange={namesFromOnChange}
        value={namesFrom}
        context={inputDataCtxt}
      />

      <p>Values From</p>
      <AttributeSelector
        onChange={valuesFromOnChange}
        value={valuesFrom}
        context={inputDataCtxt}
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
