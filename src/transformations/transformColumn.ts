import { DataSet } from "./types";
import { evalExpression } from "../utils/codapPhone";
import { datasetCaseToValues } from "./util";

/**
 * Produces a dataset with the indicated attribute's values transformed
 * to be the result of evaluating the given expression in the context
 * of each case.
 */
export async function transformColumn(
  dataset: DataSet,
  attributeName: string,
  expression: string
): Promise<DataSet> {
  const records = dataset.records.slice();
  const exprValues = await evalExpression(
    expression,
    datasetCaseToValues(records)
  );

  exprValues.forEach((value, i) => {
    const record = records[i];

    if (record.values[attributeName] === undefined) {
      throw new Error(`Invalid attribute to transform: ${attributeName}`);
    }

    record.values[attributeName] = value;
  });

  const collections = dataset.collections.slice();
  for (const coll of collections) {
    const attr = coll.attrs?.find((attr) => attr.name === attributeName);

    // erase the transformed attribute's formula and set description
    if (attr !== undefined) {
      attr.formula = undefined;
      attr.description = `The ${attributeName} attribute, transformed by the formula ${expression}`;
      break;
    }
  }

  return new Promise((resolve) =>
    resolve({
      collections,
      records,
    })
  );
}
