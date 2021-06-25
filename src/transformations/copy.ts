import { DDTransformationState } from "../transformation-components/DataDrivenTransformation";
import { readableName } from "../transformation-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";

/**
 * Produces a dataset identical to the original.
 */
export async function copy({
  context1: contextName,
}: DDTransformationState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedCopy(dataset),
    `Copy of ${ctxtName}`,
    `A copy of the ${ctxtName} dataset.`,
  ];
}

function uncheckedCopy(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: dataset.records,
  };
}
