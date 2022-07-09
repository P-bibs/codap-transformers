import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, MissingValueReport, TransformationOutput } from "./types";
import { extractAttributeAsNumeric, validateAttribute } from "./util";
import { t } from "../strings";

/**
 * Finds the median of a given attribute's values.
 */
export async function median({
  context1: contextName,
  attribute1: attribute,
  name,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }

  if (attribute === null) {
    throw new Error(t("errors:median.noAttribute"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [medianValue, mvr] = uncheckedMedian(context.name, dataset, attribute);

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered ` +
    `while computing the median, and were ignored. The median you see is the median ` +
    `of the non-missing values.`;

  name = name || "Median";

  return [
    medianValue,
    `${name}(${ctxtName}, ${attribute})`,
    `The median value of the ${attribute} attribute in the ${ctxtName} dataset.`,
    mvr,
  ];
}

/**
 * Finds the median of a given attribute's values.
 *
 * @param contextName - Name of data context associated with input dataset
 * @param dataset - The input DataSet
 * @param attribute - The column to find the median of.
 */
export function uncheckedMedian(
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
    throw new Error(t("errors:median.noValues"));
  }

  // Sort the numeric values ascending
  values.sort((a, b) => a - b);

  if (values.length % 2 === 0) {
    const middleRight = values.length / 2;
    const middleLeft = middleRight - 1;

    // Median is average of middle elements
    return [(values[middleLeft] + values[middleRight]) / 2, mvr];
  } else {
    // Median is the middle element
    return [values[Math.floor(values.length / 2)], mvr];
  }
}
