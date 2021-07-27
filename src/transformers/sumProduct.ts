import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import {
  codapValueToString,
  isMissing,
  listAsString,
  pluralSuffix,
  validateAttribute,
} from "./util";

/**
 * Takes the sum product of the given attributes' values.
 */
export async function sumProduct({
  context1: contextName,
  attributeSet1: attributes,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attributes.length === 0) {
    throw new Error(
      "Please choose at least one attribute to take the sum product of."
    );
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);
  const attributeNames = listAsString(attributes);

  return [
    await uncheckedSumProduct(dataset, attributes),
    `SumProduct(${ctxtName}, [${attributes.join(", ")}])`,
    `The sum across all cases in ${ctxtName} of the product ` +
      `of the ${pluralSuffix("attribute", attributes)} ${attributeNames}.`,
  ];
}

/**
 * Takes the sum product of the given attributes' values.
 *
 * @param dataset - The input DataSet
 * @param attributes - The attributes to take the sum product of.
 */
export function uncheckedSumProduct(
  dataset: DataSet,
  attributes: string[]
): number {
  if (attributes.length === 0) {
    throw new Error("Cannot take the sum product of zero attributes.");
  }

  for (const attr of attributes) {
    validateAttribute(dataset.collections, attr);
  }

  return dataset.records
    .map((row) =>
      attributes.reduce((product, attribute) => {
        // Missing values turn the whole row into NaN
        if (isMissing(row[attribute])) {
          return NaN;
        }
        const value = parseFloat(String(row[attribute]));
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
    .filter((product) => !isNaN(product))
    .reduce((a, b) => a + b, 0);
}
