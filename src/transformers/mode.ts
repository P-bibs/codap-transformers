import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";

/**
 * Finds the mode of a given attribute's values.
 */
export async function mode({
  context1: contextName,
  attribute1: attribute,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attribute === null) {
    throw new Error("Please choose an attribute to find the mode of.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedMode(dataset, attribute),
    `Mode of ${attribute} in ${ctxtName}`,
    `The mode value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Finds the mode of a given attribute's values.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to find the mode of.
 */
function uncheckedMode(dataset: DataSet, attribute: string): number {
  validateAttribute(dataset.collections, attribute);

  // Extract numeric values from the indicated attribute
  const values = extractAttributeAsNumeric(dataset, attribute);

  if (values.length === 0) {
    throw new Error(`Cannot find mode of no numeric values`);
  }

  // Determine the frequency of each value
  const valueToFrequency: Record<number, number> = {};
  for (const value of values) {
    if (valueToFrequency[value] === undefined) {
      valueToFrequency[value] = 0;
    }
    valueToFrequency[value]++;
  }

  // Find the value that occurs with maximum frequency. NOTE: The below cast
  // is safe because values/valueToFrequency are guaranteed to be non-empty
  // because we have already errored out if the dataset has no records.
  const [mostFrequent] = Object.entries(valueToFrequency).reduce(
    (maxes: [string, number] | undefined, elt) => {
      if (maxes === undefined) {
        return elt;
      }
      const [, frequency] = elt;
      const [, maxFrequency] = maxes;
      return frequency > maxFrequency ? elt : maxes;
    },
    undefined
  ) as [string, number];

  return Number(mostFrequent);
}
