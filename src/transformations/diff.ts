import { DataSet } from "./types";
import { dataItemToEnv } from "./util";
import { evaluate } from "../language";
import { CodapAttribute } from "../utils/codapPhone/types";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function diff(
  dataset1: DataSet,
  dataset2: DataSet,
  attribute1: string,
  attribute2: string
): DataSet {
  //   TODO:
  return {
    collections: [],
    records: [],
  };
}
