import { DataSet } from "./types";

/**
 * Produces a dataset with an identical schema (collection structure,
 * attributes) to the input, but with no records.
 */
export function copySchema(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: [],
  };
}
