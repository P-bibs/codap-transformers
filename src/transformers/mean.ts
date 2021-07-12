import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { codapValueToString } from "./util";

/**
 * Takes the mean of a given column.
 */
export async function mean({
  context1: contextName,
  attribute1: attribute,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attribute === null) {
    throw new Error("Please choose an attribute to take the mean of.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedMean(dataset, attribute),
    `Mean of ${attribute} in ${ctxtName}`,
    `The mean value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Takes the mean of a given column.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to find the mean of.
 */
function uncheckedMean(dataset: DataSet, attribute: string): number {
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
