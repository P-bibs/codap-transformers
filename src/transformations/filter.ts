import { DataSet } from "./types";
import { dataItemToEnv } from "./util";
import { evaluate } from "../language";

/**
 * Filter requires a predicate string from our expression language.
 */
type FilterExtra = {
  predicate: string;
};

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function filter(dataset: DataSet, extra: unknown): DataSet {
  const { predicate } = extra as FilterExtra;
  const filteredRecords = [];

  for (const dataItem of dataset.records) {
    // bind attribute names to values from this record,
    // evaluate the predicate in this environment
    const dataEnv = dataItemToEnv(dataItem);
    const result = evaluate(predicate, dataEnv);

    // type error if predicate does not evaluate to a boolean
    if (result.kind !== "Bool") {
      throw new Error(
        `Expected filter condition to evaluate to true/false, instead got a ${result.kind}`
      );
    }
    // include in filter if expression evaluated to true
    if (result.content) {
      filteredRecords.push(dataItem);
    }
  }

  // dataset with same context but filtered records
  return {
    context: { ...dataset.context },
    records: filteredRecords,
  };
}
