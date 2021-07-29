import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { tryTitle } from "../transformers/util";
import { getContextAndDataSet } from "../lib/codapPhone";
import { DataSet, MissingValueReport, TransformationOutput } from "./types";
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
  const ctxtName = tryTitle(context);
  const attributeNames = listAsString(attributes);

  const [sumProd, mvr] = uncheckedSumProduct(ctxtName, dataset, attributes);

  mvr.extraInfo =
    `${mvr.missingValues.length} missing values were encountered while computing ` +
    `the sum product. Any row which contained missing values was ignored.`;

  // NOTE: The output name uses {} instead of [] to show the list of attributes
  // below because [] causes problems in data context names and (through MVR)
  // the name of this sum product may appear in a data context.
  return [
    sumProd,
    `SumProduct(${ctxtName}, {${attributes.join(", ")}})`,
    `The sum across all cases in ${ctxtName} of the product ` +
      `of the ${pluralSuffix("attribute", attributes)} ${attributeNames}.`,
    mvr,
  ];
}

/**
 * Takes the sum product of the given attributes' values.
 *
 * @param contextTitle - Title of the data context associated with the input dataset
 * @param dataset - The input DataSet
 * @param attributes - The attributes to take the sum product of.
 */
export function uncheckedSumProduct(
  contextTitle: string,
  dataset: DataSet,
  attributes: string[]
): [number, MissingValueReport] {
  if (attributes.length === 0) {
    throw new Error("Cannot take the sum product of zero attributes.");
  }

  for (const attr of attributes) {
    validateAttribute(dataset.collections, attr);
  }

  const mvr: MissingValueReport = {
    missingValues: [],
  };

  const sumProd = dataset.records
    .map((row, i) =>
      attributes.reduce((product, attribute) => {
        // Missing values turn the whole row into NaN
        if (isMissing(row[attribute])) {
          const [coll, attr] = validateAttribute(
            dataset.collections,
            attribute
          );
          mvr.missingValues.push({
            context: contextTitle,
            collection: tryTitle(coll),
            attribute: tryTitle(attr),
            itemIndex: i + 1,
          });
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

  return [sumProd, mvr];
}
