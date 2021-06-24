import { DataSet } from "./types";
import {
  getContextAndDataSet,
  updateContextWithDataSet,
  deleteDataContext,
} from "../utils/codapPhone";
import { addContextUpdateListener } from "../utils/codapPhone/listeners";
import { codapValueToString } from "../transformations/util";
import {
  DDTransformationProps,
  DDTransformationState,
} from "../transformation-components/DataDrivenTransformation";
import {
  applyNewDataSet,
  readableName,
} from "../transformation-components/util";

/**
 * Contains a dataset as a result of a partition, and the distinct
 * value that all records of the dataset contain for the attribute
 * by which partitioning was performed.
 */
export interface PartitionDataset {
  dataset: DataSet;
  distinctValue: unknown;
  distinctValueAsStr: string;
}

/**
 * Sets up handlers and listeners for partition transformation
 */
export const partitionOverride = async (
  { setErrMsg }: DDTransformationProps,
  { context1: inputDataCtxt, attribute1: attributeName }: DDTransformationState
): Promise<void> => {
  setErrMsg(null);

  if (inputDataCtxt === null) {
    setErrMsg("Please choose a valid dataset to transform.");
    return;
  }
  if (attributeName === null) {
    setErrMsg("Please select an attribute to partition by.");
    return;
  }

  const doTransform: () => Promise<[PartitionDataset, string][]> = async () => {
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
};

/**
 * Breaks a dataset into multiple datasets, each which contain all
 * cases with a given distinct value of the indicated attribute.
 */
export function partition(
  dataset: DataSet,
  attribute: string
): PartitionDataset[] {
  // map from distinct values of an attribute to all records sharing that value
  const partitioned: Record<string, [unknown, Record<string, unknown>[]]> = {};

  const records = dataset.records;
  for (const record of records) {
    if (record[attribute] === undefined) {
      throw new Error(`Invalid attribute: ${attribute}`);
    }

    // convert CODAP value to string to use as a key
    const valueAsStr = JSON.stringify(record[attribute]);

    // initialize this category if needed
    if (partitioned[valueAsStr] === undefined) {
      partitioned[valueAsStr] = [record[attribute], []];
    }

    // add the record to its corresponding category of records
    partitioned[valueAsStr][1].push(record);
  }

  const results = [];
  for (const [valueStr, [value, records]] of Object.entries(partitioned)) {
    // construct new dataset with same collections but only
    // records that correspond to this value of the attribute
    results.push({
      dataset: {
        collections: dataset.collections,
        records,
      },
      distinctValue: value,
      distinctValueAsStr: valueStr,
    });
  }

  return results;
}