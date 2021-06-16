import { Collection } from "../utils/codapPhone/types";

/**
 * DataSet represents a data context and all of the actual data
 * contained within it.
 */
export type DataSet = {
  collections: Collection[];
  records: Record<string, unknown>[];
};

export type CodapLanguageType =
  | "string"
  | "any"
  | "number"
  | "boolean"
  | "boundary";
