import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { codapValueToString } from "./util";

/**
 * Finds the median of a given attribute's values.
 */
export async function median({
  context1: contextName,
  attribute1: attribute,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attribute === null) {
    throw new Error("Please choose an attribute to find the median of.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedMedian(dataset, attribute),
    `Median of ${attribute} in ${ctxtName}`,
    `The median value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Finds the median of a given attribute's values.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to find the median of.
 */
function uncheckedMedian(dataset: DataSet, attribute: string): number {
  if (dataset.records.length === 0) {
    throw new Error(`Cannot find median of dataset with no cases`);
  }

  // Extract numeric values from the indicated attribute
  const values = dataset.records.map((record) => {
    if (record[attribute] === undefined) {
      throw new Error(`Invalid attribute name: ${attribute}`);
    }
    const numericValue = parseFloat(String(record[attribute]));
    if (isNaN(numericValue)) {
      throw new Error(
        `Expected number, instead got ${codapValueToString(record[attribute])}`
      );
    }
    return numericValue;
  });

  // Sort the numeric values ascending
  values.sort((a, b) => a - b);

  if (values.length % 2 === 0) {
    const middleRight = values.length / 2;
    const middleLeft = middleRight - 1;

    // Median is average of middle elements
    return (values[middleLeft] + values[middleRight]) / 2;
  } else {
    // Median is the middle element
    return values[Math.floor(values.length / 2)];
  }
}
