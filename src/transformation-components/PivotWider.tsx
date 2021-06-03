import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { pivotWider } from "../transformations/pivot";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
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
  const [namesFrom, namesFromOnChange] = useState<string | null>(null);
  const [valuesFrom, valuesFromOnChange] = useState<string | null>(null);

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
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

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const pivoted = pivotWider(dataset, namesFrom, valuesFrom);
      return [pivoted, `Pivot Wider of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg, namesFrom, valuesFrom]);

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
      <TransformationSubmitButtons onCreate={transform} />
    </>
  );
}
