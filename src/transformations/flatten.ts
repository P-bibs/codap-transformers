import { DataSet } from "./types";
import { copyAttrs } from "../utils/codapPhone"

/**
 * Flatten produces an identical dataset with all hierarchical relationships
 * among collections collapsed into a single collection containing
 * all attributes.
 */
export function flatten(dataset: DataSet): DataSet {
  // flatten attributes of all collections into single list of attributes
  const attrs = dataset.collections.map((collection) => copyAttrs(collection.attrs) || []).flat();

  // single collection that includes flattened attributes, no labels
  const collection = {
    attrs,
    labels: {},
  }

  // dataset with same records but single collection
  return {
    collections: [collection],
    records: dataset.records.slice(),
  };
}
