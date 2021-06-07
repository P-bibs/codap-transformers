import React, { useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { copySchema } from "../transformations/copySchema";
import { DataSet } from "../transformations/types";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import { applyNewDataSet, ctxtTitle, addUpdateListener } from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";

// eslint-disable-next-line
export interface CopySchemaSaveData {}

interface CopySchemaProps extends TransformationProps {
  saveData?: CopySchemaSaveData;
}
export function CopySchema({
  setErrMsg,
  saveData,
}: CopySchemaProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));

  /**
   * Applies the copy transformation to the input data context,
   * producing an output table in CODAP.
   */
  const transform = useCallback(async () => {
    if (inputDataCtxt === null) {
      setErrMsg("Please choose a valid data context to flatten.");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const copied = copySchema(dataset);
      return [copied, `Schema Copy of ${ctxtTitle(context)}`];
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
      <p>Table to Copy the Schema of</p>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {saveData === undefined && (
        <TransformationSaveButton generateSaveData={() => ({})} />
      )}
    </>
  );
}
