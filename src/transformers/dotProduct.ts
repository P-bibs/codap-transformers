import { DDTransformerState } from "../transformer-components/DataDrivenTransformer";
import { readableName } from "../transformer-components/util";
import { getContextAndDataSet } from "../utils/codapPhone";
import { DataSet, TransformationOutput } from "./types";
import { codapValueToString, listAsString, pluralSuffix } from "./util";

/**
 * Takes the dot product of the given columns.
 */
export async function dotProduct({
  context1: contextName,
  attributeSet1: attributes,
}: DDTransformerState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }

  if (attributes.length === 0) {
    throw new Error(
      "Please choose at least one attribute to take the dot product of."
    );
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);
  const attributeNames = listAsString(attributes);

  return [
    await uncheckedDotProduct(dataset, attributes),
    `Dot Product of ${ctxtName}`,
    `The sum across all cases in ${ctxtName} of the product ` +
      `of the ${pluralSuffix("attribute", attributes)} ${attributeNames}.`,
  ];
}

/**
 * Takes the dot product of the given columns.
 *
 * @param dataset - The input DataSet
 * @param attributes - The columns to take the dot product of.
 */
function uncheckedDotProduct(dataset: DataSet, attributes: string[]): number {
  if (attributes.length === 0) {
    throw new Error("Cannot take the dot product of zero columns.");
  }

  return dataset.records
    .map((row) =>
      attributes.reduce((product, attribute) => {
        if (row[attribute] === undefined) {
          throw new Error(`Invalid attribute name: ${attribute}`);
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
    .reduce((a, b) => a + b);
}

/**
 * Temporray solution. Until text gets fixed, use a single celled table for
 * scalar values
 */
export function dotProductTable(
  dataset: DataSet,
  attributes: string[]
): DataSet {
  const records = [
    {
      "Dot Product": uncheckedDotProduct(dataset, attributes),
    },
  ];
  const collections = [
    {
      name: "Cases",
      attrs: [
        {
          name: "Dot Product",
        },
      ],
      labels: {},
    },
  ];
  return {
    collections,
    records,
  };
}
