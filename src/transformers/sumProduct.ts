import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { codapValueToString, listAsString, pluralSuffix } from "./util";

/**
 * Takes the sum product of the given attributes' values.
 */
export async function sumProduct({
  context1: contextName,
  attributeSet1: attributes,
}: DDTransformerState): Promise<TransformationOutput> {
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
    `Sum Product of ${ctxtName}`,
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

  return dataset.records
    .map((row) =>
      attributes.reduce((product, attribute) => {
        if (row[attribute] === undefined) {
          throw new Error(`Invalid attribute name: ${attribute}`);
        }
        // Missing values turn the whole row into NaN
        if (row[attribute] === "") {
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
