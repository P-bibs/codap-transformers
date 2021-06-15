import { DataSet, DataSetCase } from "./types";
import { evalExpression } from "../utils/codapPhone";
import { codapValueToString, datasetCaseToValues } from "./util";

/**
 * Filter produces a dataset with certain records excluded
 * depending on a given predicate.
 */
export async function filter(
  dataset: DataSet,
  predicate: string
): Promise<DataSet> {
  const filteredRecords: DataSetCase[] = [];

  // evaluate predicate at each case in the dataset
  const predValues = await evalExpression(
    predicate,
    datasetCaseToValues(dataset.records)
  );

  predValues.forEach((value, i) => {
    if (value !== true && value !== false) {
      throw new Error(
        `Expected predicate to evaluate to true/false, but it evaluated to ${codapValueToString(
          value
        )} at case ${i + 1}`
      );
    }

    if (value) {
      filteredRecords.push({ ...dataset.records[i] });
    }
  });

  return new Promise((resolve) =>
    resolve({
      collections: dataset.collections.slice(),
      records: filteredRecords,
    })
  );
}
