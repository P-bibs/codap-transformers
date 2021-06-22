import { CodapLanguageType, DataSet } from "./types";
import {
  evalExpression,
  getContextAndDataSet,
} from "../utils/codapPhone/index";
import { reportTypeErrorsForRecords } from "./util";
import { DDTransformationState } from "../transformation-components/DataDrivenTransformation";
import { readableName } from "../transformation-components/util";

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export async function buildColumn({
  context1: contextName,
  collection1: collectionName,
  textInput1: attributeName,
  expression1: expression,
  typeContract1: { outputType },
}: DDTransformationState): Promise<[DataSet, string]> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (collectionName === null) {
    throw new Error("Please select a collection to add to");
  }
  if (attributeName === null) {
    throw new Error("Please enter a non-empty name for the new attribute");
  }
  if (expression === "") {
    throw new Error("Please enter a non-empty expression");
  }
  if (outputType === null) {
    throw new Error("Please enter a valid output type");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  return [
    await uncheckedBuildColumn(
      dataset,
      attributeName,
      collectionName,
      expression,
      outputType
    ),
    `Build Column of ${readableName(context)}`,
  ];
}

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
async function uncheckedBuildColumn(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string,
  outputType: CodapLanguageType
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
  const colValues = await evalExpression(expression, records);

  // Check for type errors (might throw error and abort transformation)
  reportTypeErrorsForRecords(records, colValues, outputType);

  // add values for new attribute to all records
  colValues.forEach((value, i) => {
    records[i][newAttributeName] = value;
  });

  return {
    collections,
    records,
  };
}
