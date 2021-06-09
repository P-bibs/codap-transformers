import React, { useState, useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { pivotLonger } from "../transformations/pivot";
import { DataSet } from "../transformations/types";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import {
  MultiAttributeSelector,
  TransformationSubmitButtons,
  ContextSelector,
  CodapFlowTextInput,
} from "../ui-components";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

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
  errorDisplay,
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

  /**
   * Applies the user-defined transformation to the indicated input data,
   * and generates an output table into CODAP containing the transformed data.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid dataset to transform.");
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

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const pivoted = pivotLonger(dataset, attributes, namesTo, valuesTo);
      return [pivoted, `Pivot Longer of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributes, setErrMsg, namesTo, valuesTo]);

  return (
    <>
      <h3>Table to Pivot</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attributes to Pivot</h3>
      <MultiAttributeSelector
        context={inputDataCtxt}
        selected={attributes}
        setSelected={setAttributes}
        disabled={saveData !== undefined}
      />

      <h3>Names To</h3>
      <CodapFlowTextInput
        value={namesTo}
        onChange={namesToChange}
        disabled={saveData !== undefined}
      />

      <h3>Values To</h3>
      <CodapFlowTextInput
        value={valuesTo}
        onChange={valuesToChange}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributes,
            namesTo,
            valuesTo,
          })}
        />
      )}
    </>
  );
}
