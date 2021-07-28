import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";

/**
 * Takes the mean of a given column.
 */
export async function mean({
  context1: contextName,
  attribute1: attribute,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attribute === null) {
    throw new Error("Please choose an attribute to take the mean of.");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [meanValue, mvr] = uncheckedMean(ctxtName, dataset, attribute);

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered ` +
    `while computing the mean, and were ignored. The mean you see is the mean ` +
    `of the non-missing values.`;

  return [
    meanValue,
    `Mean(${ctxtName}, ${attribute})`,
    `The mean value of the ${attribute} attribute in the ${ctxtName} dataset.`,
    mvr,
  ];
}

/**
 * Takes the mean of a given column.
 *
 * @param contextTitle - Title of data context associated with input dataset
 * @param dataset - The input DataSet
 * @param attribute - The column to find the mean of.
 */
export function uncheckedMean(
  contextTitle: string,
  dataset: DataSet,
  attribute: string
): [number, MissingValueReport] {
  validateAttribute(dataset.collections, attribute);

  // Extract the numeric values from the indicated attribute.
  const [values, mvr] = extractAttributeAsNumeric(
    contextTitle,
    dataset,
    attribute
  );

  if (values.length === 0) {
    throw new Error(`Cannot find mean of no numeric values`);
  }

  // Sum them and divide by the number of records.
  return [values.reduce((acc, value) => acc + value, 0) / values.length, mvr];
}
