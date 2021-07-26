import { DataSet } from "./types";
import {
  getContextAndDataSet,
  updateContextWithDataSet,
  deleteDataContext,
} from "../lib/codapPhone";
import { pushToUndoStack } from "../lib/codapPhone/listeners";
import {
  codapValueToString,
  makeDatasetImmutable,
  validateAttribute,
} from "./util";
import {
  TransformerTemplateProps,
  TransformerTemplateState,
} from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { applyNewDataSet } from "../components/transformer-template/util";
import { ActionTypes } from "../transformerStore/types";

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

// At or more than this number of output datasets triggers a warning
const OUTPUT_WARN_THRESHOLD = 10;

/**
 * If the indicated number of output datasets is at or beyond OUTPUT_WARN_THRESHOLD,
 * this warns the user and prompts them to confirm that they'd like
 * to go ahead with creating/updating the output.
 *
 * @returns true if the number is below threshold or the user
 *  has confirmed they want the output. false otherwise.
 */
function confirmOutput(outputDatasets: number, msg: string): boolean {
  if (outputDatasets >= OUTPUT_WARN_THRESHOLD) {
    return confirm(`${msg}. Are you sure you want to proceed?`);
  }
  return true;
}

function partitionDatasetDescription(
  pd: PartitionDataset,
  originalCtxt: string,
  partitionedAttribute: string
): string {
  return (
    `One of the datasets from a partition of the ${originalCtxt} dataset ` +
    `by the ${partitionedAttribute} attribute. This dataset contains all cases ` +
    `from the original which had a value of ${codapValueToString(
      pd.distinctValue
    )} ` +
    `for the ${partitionedAttribute} attribute.`
  );
}

async function doTransform(
  inputDataCtxt: string,
  attributeName: string
): Promise<[PartitionDataset, string][]> {
  const { context, dataset } = await getContextAndDataSet(inputDataCtxt);
  const partitioned = partition(dataset, attributeName);

  // assign names to each partitioned dataset
  const readableContext = readableName(context);

  // return both the datasets and their names
  return partitioned.map((pd) => [
    { ...pd, dataset: makeDatasetImmutable(pd.dataset) },
    `Partition(${attributeName} = ${codapValueToString(
      pd.distinctValue
    )}, ${readableContext})`,
  ]);
}

/**
 * Sets up handlers and listeners for partition transformer
 */
export const partitionOverride = async (
  { setErrMsg, activeTransformationsDispatch }: TransformerTemplateProps,
  {
    context1: inputDataCtxt,
    attribute1: attributeName,
  }: TransformerTemplateState
): Promise<void> => {
  if (inputDataCtxt === null) {
    setErrMsg("Please choose a valid dataset to transform.");
    return;
  }
  if (attributeName === null) {
    setErrMsg("Please select an attribute to partition by.");
    return;
  }

  const transformed = await doTransform(inputDataCtxt, attributeName);

  if (transformed.length === 0) {
    if (
      !confirm(
        `This partition will create 0 datasets but still go through. Is this what you intend?`
      )
    ) {
      return;
    }
  }

  if (
    !confirmOutput(
      transformed.length,
      `This partition will create ${transformed.length} new datasets`
    )
  ) {
    return;
  }

  const valueToContext: Record<string, string> = {};
  const outputContexts: string[] = [];

  const { context: inputContext } = await getContextAndDataSet(inputDataCtxt);
  const inputDataCtxtName = readableName(inputContext);

  for (const [partitioned, name] of transformed) {
    const newContextName = await applyNewDataSet(
      partitioned.dataset,
      name,
      partitionDatasetDescription(partitioned, inputDataCtxtName, attributeName)
    );
    valueToContext[partitioned.distinctValueAsStr] = newContextName;
    outputContexts.push(newContextName);
  }

  // Register undo action for partition transformer
  pushToUndoStack(
    "Apply partition transformer",
    () => outputContexts.forEach((context) => deleteDataContext(context)),
    () =>
      partitionOverride(
        { setErrMsg } as TransformerTemplateProps,
        {
          context1: inputDataCtxt,
          attribute1: attributeName,
        } as TransformerTemplateState
      )
  );

  activeTransformationsDispatch({
    type: ActionTypes.ADD,
    newTransformation: {
      inputs: [inputDataCtxt],
      extraDependencies: outputContexts,
      transformer: "Partition",
      state: {
        inputDataCtxt,
        attributeName,
        outputContexts,
        valueToContext,
      },
    },
  });
};

export interface PartitionSaveState {
  inputDataCtxt: string;
  attributeName: string;
  outputContexts: string[];
  valueToContext: Record<string, string>;
}

export async function partitionUpdate(state: PartitionSaveState): Promise<{
  extraDependencies?: string[];
  state?: Partial<PartitionSaveState>;
}> {
  try {
    return await partitionUpdateInner(state);
  } catch (e) {
    throw new Error(`Error updating partitioned tables: ${e.message}`);
  }
}

async function partitionUpdateInner({
  inputDataCtxt,
  attributeName,
  outputContexts,
  valueToContext,
}: PartitionSaveState): Promise<{
  extraDependencies?: string[];
  state?: Partial<PartitionSaveState>;
}> {
  const transformed = await doTransform(inputDataCtxt, attributeName);

  const { context: inputContext } = await getContextAndDataSet(inputDataCtxt);
  const inputDataCtxtName = readableName(inputContext);

  if (
    !confirmOutput(
      transformed.length,
      `Updating the partition of "${inputDataCtxtName}" will lead to ${transformed.length} total output datasets`
    )
  ) {
    return {};
  }

  const newValueToContext: Record<string, string> = {};
  while (outputContexts.length > 0) {
    outputContexts.pop();
  }

  for (const [partitioned, name] of transformed) {
    const contextName = valueToContext[partitioned.distinctValueAsStr];
    if (contextName === undefined) {
      const newName = await applyNewDataSet(
        partitioned.dataset,
        name,
        partitionDatasetDescription(
          partitioned,
          inputDataCtxtName,
          attributeName
        )
      );
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
      transformed.find(([pd]) => pd.distinctValueAsStr === value) === undefined
    ) {
      deleteDataContext(context);
    }
  }

  return {
    extraDependencies: outputContexts,
    state: { valueToContext: newValueToContext },
  };
}

/**
 * Breaks a dataset into multiple datasets, each which contain all
 * cases with a given distinct value of the indicated attribute.
 */
export function partition(
  dataset: DataSet,
  attribute: string
): PartitionDataset[] {
  validateAttribute(dataset.collections, attribute);

  // map from distinct values of an attribute to all records sharing that value
  const partitioned: Record<string, [unknown, Record<string, unknown>[]]> = {};

  const records = dataset.records;
  for (const record of records) {
    // Convert CODAP value to string to use as a key.
    // NOTE: If record[attribute] is undefined (missing), this will use "" instead.
    const valueAsStr = JSON.stringify(record[attribute] || "");

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
