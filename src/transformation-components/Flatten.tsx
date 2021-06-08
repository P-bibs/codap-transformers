import React, { useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { flatten } from "../transformations/flatten";
import { DataSet } from "../transformations/types";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

// eslint-disable-next-line
export interface FlattenSaveData {}

interface FlattenProps extends TransformationProps {
  saveData?: FlattenSaveData;
}

export function Flatten({
  setErrMsg,
  saveData,
  errorDisplay,
}: FlattenProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  /**
   * Applies the flatten transformation to the input data context,
   * producing an output table in CODAP.
   */
  const transform = useCallback(async () => {
    setErrMsg(null);

    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to flatten.");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const flat = flatten(dataset);
      return [flat, `Flatten of ${ctxtTitle(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg]);

  return (
    <>
      <h3>Table to Flatten</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({})} />
      )}
    </>
  );
}
