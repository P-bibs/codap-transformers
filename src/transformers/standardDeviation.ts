import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";
import { t } from "../strings";

/**
 * Finds the standard deviation of a given attribute's values.
 */
export async function standardDeviation({
  context1: contextName,
  attribute1: attribute,
  name,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  if (attribute === null) {
    throw new Error(t("errors:standardDeviation.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [stdDev, mvr] = uncheckedStandardDeviation(
    context.name,
    dataset,
    attribute
  );

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered while computing ` +
    `the standard deviation, and were ignored. The standard deviation you see is ` +
    `the standard deviation of the non-missing values.`;

  name = name || "StandardDeviation";

  return [
    stdDev,
    `${name}(${ctxtName}, ${attribute})`,
    `The standard deviation of the ${attribute} attribute in the ${ctxtName} dataset.`,
    mvr,
  ];
}

/**
 * Computes the mean value of a list of values.
 *
 * @param vs List of values to compute mean over
 * @returns The mean value
 */
function mean(vs: number[]): number {
  return vs.reduce((a, b) => a + b, 0) / vs.length;
}

/**
 * Finds the standard deviation of a given attribute's values.
 *
 * @param contextName - Name of data context associated with input dataset
 * @param dataset - The input DataSet
 * @param attribute - The column to find the standard deviation of.
 */
export function uncheckedStandardDeviation(
  contextName: string,
  dataset: DataSet,
  attribute: string
): [number, MissingValueReport] {
  validateAttribute(dataset.collections, attribute);

  // Extract numeric values from the indicated attribute
  const [values, mvr] = extractAttributeAsNumeric(
    contextName,
    dataset,
    attribute
  );

  if (values.length === 0) {
    throw new Error(t("errors:standardDeviation.noValues"));
  }

  const populationMean = mean(values);
  const squaredDeviations = values.map((v) => Math.pow(v - populationMean, 2));
  const variance = mean(squaredDeviations);
  const stdDev = Math.sqrt(variance);

  return [stdDev, mvr];
}
