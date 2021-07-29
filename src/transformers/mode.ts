import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";
import { t } from "../strings";

/**
 * Finds the mode of a given attribute's values.
 */
export async function mode({
  context1: contextName,
  attribute1: attribute,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  if (attribute === null) {
    throw new Error(t("errors:mode.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedMode(dataset, attribute),
    `Mode(${ctxtName}, ${attribute})`,
    `The mode value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Finds the mode of a given attribute's values.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to find the mode of.
 */
export function uncheckedMode(dataset: DataSet, attribute: string): number[] {
  validateAttribute(dataset.collections, attribute);

  // Extract numeric values from the indicated attribute
  const values = extractAttributeAsNumeric(dataset, attribute);

  if (values.length === 0) {
    throw new Error(t("errors:mode.noValues"));
  }

  // Determine the frequency of each value
  const valueToFrequency: Record<number, number> = {};
  for (const value of values) {
    if (valueToFrequency[value] === undefined) {
      valueToFrequency[value] = 0;
    }
    valueToFrequency[value]++;
  }

  // Find the maximum frequency of any element in the value to frequency map.
  // The below cast to number is safe because we already checked that values
  // (and therefore valueToFrequency) is non-empty and therefore some max exists.
  const maxFrequency = Object.entries(valueToFrequency).reduce(
    (maxFrequency: number | undefined, elt) => {
      const [, frequency] = elt;
      if (maxFrequency === undefined) {
        return frequency;
      } else {
        return frequency > maxFrequency ? frequency : maxFrequency;
      }
    },
    undefined
  ) as number;

  // Return all values which have the max frequency
  return Object.keys(valueToFrequency)
    .map((v) => Number(v))
    .filter((v) => valueToFrequency[v] === maxFrequency);
}
