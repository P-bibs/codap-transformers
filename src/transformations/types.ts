import { Collection } from "../utils/codapPhone/types";

/**
 * DataSet represents a data context and all of the actual data
 * contained within it.
 */
export type DataSet = {
  collections: Collection[];
  records: DataSetCase[];
};

/**
 * DataSetCase represents a single case within a dataset. It is effectively
 * a data item along with the case ID from the lowest (child-most) collection in
 * the hierarchy.
 */
export type DataSetCase = {
  id?: number;
  values: Record<string, unknown>;
};
