import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";
import { t } from "../strings";

/**
 * Takes the mean of a given column.
 */
export async function mean({
  context1: contextName,
  attribute1: attribute,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  if (attribute === null) {
    throw new Error(t("errors:mean.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    uncheckedMean(dataset, attribute),
    `Mean(${ctxtName}, ${attribute})`,
    `The mean value of the ${attribute} attribute in the ${ctxtName} dataset.`,
  ];
}

/**
 * Takes the mean of a given column.
 *
 * @param dataset - The input DataSet
 * @param attribute - The column to find the mean of.
 */
export function uncheckedMean(dataset: DataSet, attribute: string): number {
  validateAttribute(dataset.collections, attribute);

  // Extract the numeric values from the indicated attribute.
  const values = extractAttributeAsNumeric(dataset, attribute);

  if (values.length === 0) {
    throw new Error(t("errors:mean.noValues"));
  }

  // Sum them and divide by the number of records.
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}
