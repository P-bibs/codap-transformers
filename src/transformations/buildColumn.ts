import { DataSet } from "./types";
import { evalExpression } from "../utils/codapPhone/index";
import { datasetCaseToValues } from "./util";

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export async function buildColumn(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string
): Promise<DataSet> {
  // find collection to add attribute to
  const collections = dataset.collections.slice();
  const toAdd = collections.find((coll) => coll.name === collectionName);

  if (toAdd === undefined) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }

  // ensure no duplicate attr names
  if (
    collections.find((coll) =>
      coll.attrs?.find((attr) => attr.name === newAttributeName)
    )
  ) {
    throw new Error(`Attribute name already in use: ${newAttributeName}`);
  }

  if (toAdd.attrs === undefined) {
    toAdd.attrs = [];
  }

  // add new attribute
  toAdd.attrs.push({
    name: newAttributeName,
    description: `An attribute whose values were computed with the formula ${expression}`,
  });

  const records = dataset.records.slice();
  const colValues = await evalExpression(
    expression,
    datasetCaseToValues(records)
  );

  // add values for new attribute to all records
  colValues.forEach((value, i) => {
    records[i].values[newAttributeName] = value;
  });

  return {
    collections,
    records,
  };
}
