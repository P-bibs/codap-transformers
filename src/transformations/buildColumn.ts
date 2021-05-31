import { DataSet } from "./types";
import { dataItemToEnv, guardAgainstMissingInFormula } from "./util";
import { evaluate } from "../language";

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export function buildColumn(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string
): DataSet {
  guardAgainstMissingInFormula(dataset, expression);

  // find collection to add attribute to
  const collections = dataset.collections.slice();
  const toAdd = collections.find((coll) => coll.name === collectionName);

  if (toAdd === undefined) {
    throw new Error(`invalid collection name: ${collectionName}`);
  }

  // ensure no duplicate attr names
  if (
    collections.find((coll) =>
      coll.attrs?.find((attr) => attr.name === newAttributeName)
    )
  ) {
    throw new Error(`attribute name already in use: ${newAttributeName}`);
  }

  if (toAdd.attrs === undefined) {
    toAdd.attrs = [];
  }

  // add new attribute
  toAdd.attrs.push({
    name: newAttributeName,
  });

  // add new values for this attribute to each record
  const records = dataset.records.slice();
  for (const record of records) {
    const env = dataItemToEnv(record);
    record[newAttributeName] = evaluate(expression, env).content;
  }

  return {
    collections,
    records,
  };
}
