import { DataSet } from "./types";
import { dataItemToEnv, guardAgainstMissingInFormula } from "./util";
import { evaluate } from "../language";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export function filter(dataset: DataSet, predicate: string): DataSet {
  guardAgainstMissingInFormula(dataset, predicate);

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
    collections: dataset.collections.slice(),
    records: filteredRecords,
  };
}
