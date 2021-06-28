import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { codapValueToString } from "./util";

/**
 * Takes the average of a given column.
 */
export async function average({
  context1: contextName,
  attribute1: attribute,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attribute === null) {
    throw new Error("Please choose an attribute to take the average of.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedAverage(dataset, attribute),
    `Average of ${attribute} in ${ctxtName}`,
    `The average value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Takes the average of a given column.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to take the dot product of.
 */
function uncheckedAverage(dataset: DataSet, attribute: string): number {
  const sum = dataset.records.reduce((acc, row) => {
    if (row[attribute] === undefined) {
      throw new Error(`Invalid attribute name: ${attribute}`);
    }
    const value = Number(row[attribute]);
    if (isNaN(value)) {
      throw new Error(
        `Expected number, instead got ${codapValueToString(row[attribute])}`
      );
    }
    return acc + value;
  }, 0);
  return sum / dataset.records.length;
}

/**
 * Temporray solution. Until text gets fixed, use a single celled table for
 * scalar values
 */
export function averageTable(dataset: DataSet, attribute: string): DataSet {
  const records = [
    {
      Average: uncheckedAverage(dataset, attribute),
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
