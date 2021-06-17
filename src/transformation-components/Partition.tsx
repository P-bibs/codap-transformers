import React, { useCallback, ReactElement, useState } from "react";
import {
  getContextAndDataSet,
  updateContextWithDataSet,
  deleteDataContext,
} from "../utils/codapPhone";
import { addContextUpdateListener } from "../utils/codapPhone/listeners";
import { useInput } from "../utils/hooks";
import { partition, PartitionDataset } from "../transformations/partition";
import {
  TransformationSubmitButtons,
  ContextSelector,
  AttributeSelector,
} from "../ui-components";
import { applyNewDataSet, readableName } from "./util";
import TransformationSaveButton from "../ui-components/TransformationSaveButton";
import { TransformationProps } from "./types";
import { codapValueToString } from "../transformations/util";

// FIXME: this should be attributeName: string
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
        const partitioned = partition(dataset, attributeName);

        // assign names to each partitioned dataset
        const readableContext = readableName(context);

        // return both the datasets and their names
        return partitioned.map((pd) => [
          pd,
          `Partition of ${readableContext} by ${attributeName} = ${codapValueToString(
            pd.distinctValue
          )}`,
        ]);
      };

    try {
      const transformed = await doTransform();
      let valueToContext: Record<string, string> = {};
      const outputContexts: string[] = [];

      for (const [partitioned, name] of transformed) {
        const newContextName = await applyNewDataSet(partitioned.dataset, name);
        valueToContext[partitioned.distinctValueAsStr] = newContextName;
        outputContexts.push(newContextName);
      }

      // listen for updates to the input data context
      addContextUpdateListener(inputDataCtxt, outputContexts, async () => {
        try {
          setErrMsg(null);
          const transformed = await doTransform();
          const newValueToContext: Record<string, string> = {};
          while (outputContexts.length > 0) {
            outputContexts.pop();
          }

          for (const [partitioned, name] of transformed) {
            const contextName = valueToContext[partitioned.distinctValueAsStr];
            if (contextName === undefined) {
              const newName = await applyNewDataSet(partitioned.dataset, name);
              // this is a new table (a new distinct value)
              newValueToContext[partitioned.distinctValueAsStr] = newName;
              outputContexts.push(newName);
            } else {
              // apply an update to a previous dataset
              updateContextWithDataSet(contextName, partitioned.dataset);

              // copy over existing context name into new valueToContext mapping
              newValueToContext[partitioned.distinctValueAsStr] = contextName;
              outputContexts.push(contextName);
            }
          }

          for (const [value, context] of Object.entries(valueToContext)) {
            // if there is no longer a partition for this value
            if (
              transformed.find(([pd]) => pd.distinctValueAsStr === value) ===
              undefined
            ) {
              deleteDataContext(context);
            }
          }

          // update valueToContext to reflect the updates
          valueToContext = newValueToContext;
        } catch (e) {
          setErrMsg(`Error updating partitioned tables: ${e.message}`);
        }
      });
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
