import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";

/**
 * Produces a dataset with an identical structure (collection hierarchy,
 * attributes) to the input, but with no records.
 */
export async function copyStructure({
  context1: contextName,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedCopyStructure(dataset),
    `CopyStructure(${ctxtName})`,
    `A copy of the collections and attributes of the ${ctxtName} dataset, but with no cases.`,
  ];
}

export function uncheckedCopyStructure(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: [],
  };
}
