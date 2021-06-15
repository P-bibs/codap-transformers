import { DataSet } from "./types";
import { codapValueToString } from "./util";

/**
 * Takes the average of a given column.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to take the dot product of.
 */
export function average(dataset: DataSet, attribute: string): number {
  const sum = dataset.records.reduce((acc, row) => {
    if (row.values[attribute] === undefined) {
      throw new Error(`Invalid attribute name: ${attribute}`);
    }
    const value = Number(row.values[attribute]);
    if (isNaN(value)) {
      throw new Error(
        `Expected number, instead got ${codapValueToString(
          row.values[attribute]
        )}`
      );
    }
    return acc + value;
  }, 0);
  return sum / dataset.records.length;
}

/**
 * Temporary solution. Until text gets fixed, use a single celled table for
 * scalar values
 */
export function averageTable(dataset: DataSet, attribute: string): DataSet {
  const records = [
    {
      values: {
        Average: average(dataset, attribute),
      },
    },
  ];
  const collections = [
    {
      name: "Cases",
      attrs: [
        {
          name: "Average",
        },
      ],
      labels: {},
    },
  ];
  return {
    collections,
    records,
  };
}
