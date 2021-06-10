import { DataSet } from "./types";

/**
 * Contains a dataset as a result of a partition, and the distinct
 * value that all records of the dataset contain for the attribute
 * by which partitioning was performed.
 */
export interface PartitionDataset {
  dataset: DataSet;
  distinctValue: string;
}

/**
 * Breaks a dataset into multiple datasets, each which contain all
 * cases with a given distinct value of the indicated attribute.
 */
export function partition(
  dataset: DataSet,
  attribute: string
): PartitionDataset[] {
  // map from distinct values of an attribute to all records sharing that value
  const partitioned: Record<string, Record<string, unknown>[]> = {};

  const records = dataset.records.slice();
  for (const record of records) {
    if (record[attribute] === undefined) {
      throw new Error(`Invalid attribute: ${attribute}`);
    }

    // convert CODAP value to string to use as a key
    const valueAsStr = JSON.stringify(record[attribute]);

    // initialize this category if needed
    if (partitioned[valueAsStr] === undefined) {
      partitioned[valueAsStr] = [];
    }

    // add the record to its corresponding category of records
    partitioned[valueAsStr].push(record);
  }

  const results = [];
  for (const value in partitioned) {
    // construct new dataset with same collections but only
    // records that correspond to this value of the attribute
    results.push({
      dataset: {
        collections: dataset.collections.slice(),
        records: partitioned[value],
      },
      distinctValue: value,
    });
  }

  return results;
}
