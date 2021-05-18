import { DataSet } from "./types";
import { insertColumnInLastCollection } from "./util";

export function runningSum(
  dataset: DataSet,
  inputColumnName: string,
  resultColumnName: string
): DataSet {
  let sum = 0;

  const resultRecords = dataset.records.map((row) => {
    const numValue = Number(row[inputColumnName]);
    if (!isNaN(numValue)) {
      sum += numValue;
      const result = { ...row };
      result[resultColumnName] = sum;
      return result;
    } else {
      throw new Error(
        "Unsupported value for running sum ${row[inputColumnName]}"
      );
    }
  });

  const newCollections = insertColumnInLastCollection(dataset.collections, {
    name: resultColumnName,
    type: "numeric",
  });

  return {
    collections: newCollections,
    records: resultRecords,
  };
}
