import { DataSet } from "./types";

/**
 * Flatten produces an identical dataset with all hierarchical relationships
 * among collections collapsed into a single collection containing
 * all attributes.
 */
export function flatten(dataset: DataSet): DataSet {
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
