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

/**
 * CaseMap represents a mapping from (context, id) to a list of (context, ids)
 * pairs. The keys come from input contexts to a transformation, and map
 * cases onto cases in output contexts (the values).
 *
 * NOTE: This can be used to map cases by their indices or by their IDs.
 */
export type CaseMap = Map<string, Map<number, [string, number[]][]>>;
