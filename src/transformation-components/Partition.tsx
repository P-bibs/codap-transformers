import React, { useCallback, ReactElement, useState } from "react";
import { getContextAndDataSet } from "../utils/codapPhone";
import { useInput } from "../utils/hooks";
import { partition, PartitionDataset } from "../transformations/partition";
import { DataSet } from "../transformations/types";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet, readableName, addUpdateListener } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { TransformationProps } from "./types";

export interface PartitionSaveData {
  attributeName: string | null;
}

interface PartitionProps extends TransformationProps {
  saveData?: PartitionSaveData;
}

export function Partition({
  setErrMsg,
  saveData,
  errorDisplay,
}: PartitionProps): ReactElement {
  const [inputDataCtxt, inputChange] = useInput<
    string | null,
    HTMLSelectElement
  >(null, () => setErrMsg(null));
  const [attributeName, attributeNameChange] = useState<string | null>(
    saveData !== undefined ? saveData.attributeName : null
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
    if (attributeName === null) {
      setErrMsg("Please select an attribute to partition by.");
      return;
    }

    const doTransform: () => Promise<[PartitionDataset, string][]> =
      async () => {
        const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
        const partitioned = await partition(dataset, attributeName);

        // assign names to each partitioned dataset
        const readableContext = readableName(context);

        // return both the datasets and their names
        return partitioned.map((dataset) => [
          dataset,
          `Partition of ${readableContext} by ${attributeName} = ${dataset.distinctValue}`,
        ]);
      };

    try {
      const transformed = await doTransform();

      for (const [partitioned, name] of transformed) {
        const newContextName = await applyNewDataSet(partitioned.dataset, name);

        // FIXME: what to do about updating when a transformation
        // generates multiple output contexts
        // addUpdateListener(
        //   inputDataCtxt,
        //   newContextName,
        //   doTransform,
        //   setErrMsg
        // );
      }
    } catch (e) {
      setErrMsg(e.message);
    }
  }, [inputDataCtxt, attributeName, setErrMsg]);

  return (
    <>
      <h3>Table to Partition</h3>
      <ContextSelector onChange={inputChange} value={inputDataCtxt} />

      <h3>Attribute to Partition By</h3>
      <AttributeSelector
        onChange={attributeNameChange}
        value={attributeName}
        context={inputDataCtxt}
        disabled={saveData !== undefined}
      />

      <br />
      <TransformationSubmitButtons onCreate={transform} />
      {errorDisplay}
      {saveData === undefined && (
        <TransformationSaveButton
          generateSaveData={() => ({
            attributeName,
          })}
        />
      )}
    </>
  );
}
