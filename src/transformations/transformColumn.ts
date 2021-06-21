import { CodapLanguageType, DataSet } from "./types";
import { evalExpression, getContextAndDataSet } from "../utils/codapPhone";
import { reportTypeErrorsForRecords } from "./util";
import { DDTransformationState } from "../transformation-components/DDTransformation";
import { readableName } from "../transformation-components/util";

/**
 * Produces a dataset with the indicated attribute's values transformed
 * to be the result of evaluating the given expression in the context
 * of each case.
 */
export async function transformColumn({
  context1: contextName,
  textInput1: attributeName,
  expression1: expression,
  typeContract1: { outputType },
}: DDTransformationState): Promise<[DataSet, string]> {
  if (contextName === null) {
    throw new Error("Please choose a valid dataset to transform.");
  }
  if (attributeName === null) {
    throw new Error("Please select an attribute to transform");
  }
  if (expression === "") {
    throw new Error("Please enter a non-empty expression to transform with");
  }
  if (outputType === null) {
    throw new Error("Please enter a valid output type");
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  return [
    await uncheckedTransformColumn(
      dataset,
      attributeName,
      expression,
      outputType
    ),
    `Transform Column of ${readableName(context)}`,
  ];
}

export async function uncheckedTransformColumn(
  dataset: DataSet,
  attributeName: string,
  expression: string,
  outputType: CodapLanguageType
): Promise<DataSet> {
  const records = dataset.records.slice();
  const exprValues = await evalExpression(expression, records);

  // Check for type errors (might throw error and abort transformation)
  reportTypeErrorsForRecords(records, exprValues, outputType);

  exprValues.forEach((value, i) => {
    const record = records[i];

    if (record[attributeName] === undefined) {
      throw new Error(`Invalid attribute to transform: ${attributeName}`);
    }

    record[attributeName] = value;
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
