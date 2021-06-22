import { DataSet } from "./types";

/**
 * Produces a dataset identical to the original.
 */
export function copy(dataset: DataSet): DataSet {
  return {
    collections: dataset.collections,
    records: dataset.records,
  };
}
