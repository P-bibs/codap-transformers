import { DataSet } from "./types";
import { evalExpression } from "../utils/codapPhone";

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
  const exprValues = await evalExpression(expression, records);

  exprValues.forEach((value, i) => {
    const record = records[i];

    if (record[attributeName] === undefined) {
      throw new Error(`invalid attribute to transform: ${attributeName}`);
    }

    record[attributeName] = value;
  });

  return new Promise((resolve) =>
    resolve({
      collections: dataset.collections.slice(),
      records,
    })
  );
}
