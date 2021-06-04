import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import {
  useInput,
  useContextUpdateListenerWithFlowEffect,
} from "../utils/hooks";
import { pivotWider } from "../transformations/pivot";
import { applyNewDataSet, ctxtTitle } from "./util";
import {
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { TransformationProps } from "./types";

export interface PivotWiderSaveData {
  namesFrom: string;
  valuesFrom: string;
}

interface PivotWiderProps extends TransformationProps {
  saveData?: PivotWiderSaveData;
}

export function PivotWider({
  setErrMsg,
  saveData,
}: PivotWiderProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [namesFrom, namesFromOnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(saveData !== undefined ? saveData.namesFrom : null, () => setErrMsg(null));
  const [valuesFrom, valuesFromOnChange] = useInput<
    string | null,
    HTMLSelectElement
  >(saveData !== undefined ? saveData.valuesFrom : null, () => setErrMsg(null));

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

      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);

      try {
        const pivoted = pivotWider(dataset, namesFrom, valuesFrom);
        await applyNewDataSet(
          pivoted,
          `Pivot Wider of ${ctxtTitle(context)}`,
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
