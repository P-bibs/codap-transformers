import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";

/**
 * Flatten produces an identical dataset with all hierarchical relationships
 * among collections collapsed into a single collection containing
 * all attributes.
 */
export async function flatten({
  context1: contextName,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedFlatten(dataset),
    `Flatten of ${ctxtName}`,
    `A copy of ${ctxtName} in which all collections have been flattened into one collection.`,
  ];
}

export function uncheckedFlatten(dataset: DataSet): DataSet {
  // flatten attributes of all collections into single list of attributes
  const attrs = dataset.collections
    .map((collection) => collection.attrs || [])
    .flat();

  // create combined name for collection
  const name = dataset.collections.map((c) => c.name).join(" + ");

  // single collection that includes flattened attributes, no labels
  const collection = {
    name,
    attrs,
    labels: {},
  };

  // dataset with same records but single collection
  return {
    collections: [collection],
    records: dataset.records,
  };
}