import { DDTransformationState } from "../transformation-components/DDTransformation";
import { readableName } from "../transformation-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet } from "./types";

/**
 * Produces a dataset with an identical schema (collection structure,
 * attributes) to the input, but with no records.
 */
export async function copySchema({
  context1: contextName,
}: DDTransformationState): Promise<[DataSet, string]> {
  if (contextName === null) {
    throw new Error("Please choose a valid data context to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  return [
    await uncheckedCopySchema(dataset),
    `Schema Copy of ${readableName(context)}`,
  ];
}

export function uncheckedCopySchema(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections.slice(),
    records: [],
  };
}
