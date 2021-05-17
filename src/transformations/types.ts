import { Collection } from "../utils/codapPhone/types";

/**
 * DataSet represents a data context and all of the actual data
 * contained within it.
 */
export type DataSet = {
  collections: Pick<Collection, "attrs" | "labels">[];
  records: Record<string, unknown>[];
};

/**
 * A transformation operates on a dataset to produce a new,
 * transformed dataset.
 */
export interface Transformation {
  (dataset: DataSet, extra?: unknown): DataSet;
}
