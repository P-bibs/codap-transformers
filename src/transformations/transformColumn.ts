import { DataSet } from "./types";
import { dataItemToEnv } from "./util";
import { evaluate } from "../language";

/**
 * Produces a dataset with the indicated attribute's values transformed
 * to be the result of evaluating the given expression in the context
 * of each case.
 */
export function transformColumn(
  dataset: DataSet,
  attributeName: string,
  expression: string
): DataSet {
  const records = dataset.records.slice();
  for (const record of records) {
    if (record[attributeName] === undefined) {
      throw new Error(`invalid attribute name: ${attributeName}`);
    }

    // transform each cell under this attribute by evaluating
    // expression in the env determined by the record
    const env = dataItemToEnv(record);
    record[attributeName] = evaluate(expression, env).content;
  }

  return {
    collections: dataset.collections.slice(),
    records,
  };
}
