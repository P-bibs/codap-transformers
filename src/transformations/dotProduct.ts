import { DataSet } from "./types";
import { codapValueToString } from "./util";

/**
 * Takes the dot product of the given columns.
 *
 * @param dataset - The input DataSet
 * @param attributes - The columns to take the dot product of.
 */
export function dotProduct(dataset: DataSet, attributes: string[]): number {
  if (attributes.length === 0) {
    throw new Error("Cannot take the dot product of zero columns.");
  }

  return dataset.records
    .map((row) =>
      attributes.reduce((product, attribute) => {
        const value = Number(row[attribute]);
        if (isNaN(value)) {
          throw new Error(
            `Expected number in attribute ${attribute}, instead got ${codapValueToString(
              row[attribute]
            )}`
          );
        }
        return product * value;
      }, 1)
    )
    .reduce((a, b) => a + b);
}

/**
 * Temporray solution. Until text gets fixed, use a single celled table for
 * scalar values
 */
export function dotProductTable(
  dataset: DataSet,
  attributes: string[]
): DataSet {
  const records = [
    {
      "Dot Product": dotProduct(dataset, attributes),
    },
  ];
  const collections = [
    {
      name: "Cases",
      attrs: [
        {
          name: "Dot Product",
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
