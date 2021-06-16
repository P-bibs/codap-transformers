import React, { useCallback, ReactElement } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { copy } from "../transformations/copy";
import { DataSet } from "../transformations/types";
import { TransformationSubmitButtons, ContextSelector } from "../ui-components";
import {
  applyNewDataSet,
  readableName,
  addUpdateListener,
  setupSelectionListener,
  identityIndexMap,
} from "./util";
import { TransformationProps } from "./types";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { indexMapToIDMap } from "../transformations/util";

export type CopySaveData = Record<string, never>;

interface CopyProps extends TransformationProps {
  saveData?: CopySaveData;
}
export function Copy({
  setErrMsg,
  saveData,
  errorDisplay,
}: CopyProps): ReactElement {
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
      setErrMsg("Please choose a valid dataset to transform.");
      return;
    }

    const doTransform: () => Promise<[DataSet, string]> = async () => {
      const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
      const copied = copy(dataset);
      return [copied, `Copy of ${readableName(context)}`];
    };

    try {
      const newContextName = await applyNewDataSet(...(await doTransform()));
      addUpdateListener(inputDataCtxt, newContextName, doTransform, setErrMsg);

      // NOTE: very rough draft of how selection listening would work
      // in the simple case (identity map). Note how we have to query
      // for the dataset info *after* the output context(s) have been created.
      const { dataset: inDataset, parentToChildMap } =
        await getContextAndDataSet(inputDataCtxt);
      const { dataset: outDataset } = await getContextAndDataSet(
        newContextName
      );
      const indexMap = identityIndexMap(
        inputDataCtxt,
        inDataset,
        newContextName,
        outDataset
      );
      const idMap = indexMapToIDMap(
        indexMap,
        [[inputDataCtxt, inDataset]],
        [[newContextName, outDataset]]
      );
      setupSelectionListener(inputDataCtxt, parentToChildMap, idMap);
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, setErrMsg]);

  return (
    <>
      <h3>Table to Copy</h3>
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
