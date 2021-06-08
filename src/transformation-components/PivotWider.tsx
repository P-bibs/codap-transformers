import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { pivotWider } from "../transformations/pivot";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import {
  AttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
} from "../ui-components";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

export interface PivotWiderSaveData {
  namesFrom: string | null;
  valuesFrom: string | null;
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

  const [namesFrom, namesFromOnChange] = useState<string | null>(
    saveData !== undefined ? saveData.namesFrom : null
  );
  const [valuesFrom, valuesFromOnChange] = useState<string | null>(
    saveData !== undefined ? saveData.valuesFrom : null
  );

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
      return [pivoted, `Pivot Wider of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
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
        disabled={saveData !== undefined}
      />

      <p>Values From</p>
      <AttributeSelector
        onChange={valuesFromOnChange}
        value={valuesFrom}
        context={inputDataCtxt}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            namesFrom,
            valuesFrom,
          })}
        />
      )}
    </>
  );
}
