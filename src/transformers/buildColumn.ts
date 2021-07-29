import { CodapLanguageType, DataSet, TransformationOutput } from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone/index";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { readableName } from "../transformers/util";
import { cloneCollection } from "./util";
import { reportTypeErrorsForRecords } from "../lib/utils/typeChecking";
import { t } from "../strings";

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
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (collectionName === null) {
    throw new Error(t("errors:buildColumn.noCollection"));
  }
  if (attributeName.trim() === "") {
    throw new Error(t("errors:buildColumn.noAttribute"));
  }
  if (expression.trim() === "") {
    throw new Error(t("errors:buildColumn.noExpression"));
  }
  if (outputType === null) {
    throw new Error(t("errors:buildColumn.noOutputType"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = readableName(context);

  return [
    await uncheckedBuildColumn(
      dataset,
      attributeName,
      collectionName,
      expression,
      outputType
    ),
    `BuildColumn(${ctxtName}, ...)`,
    `A copy of ${ctxtName} with a new attribute (${attributeName}) added to ` +
      `the ${collectionName} collection, whose value is determined by the formula \`${expression}\`.`,
  ];
}

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export async function uncheckedBuildColumn(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<DataSet> {
  // find collection to add attribute to
  const collections = dataset.collections.map(cloneCollection);
  const toAdd = collections.find((coll) => coll.name === collectionName);

  if (toAdd === undefined) {
    throw new Error(
      t("errors:validation.invalidCollection", { name: collectionName })
    );
  }

  // ensure no duplicate attr names
  if (
    collections.find((coll) =>
      coll.attrs?.find((attr) => attr.name === newAttributeName)
    )
  ) {
    throw new Error(
      t("errors:validation.duplicateAttribute", { name: newAttributeName })
    );
  }

  if (toAdd.attrs === undefined) {
    toAdd.attrs = [];
  }

  // add new attribute
  toAdd.attrs.push({
    name: newAttributeName,
    description: `An attribute whose values were computed with the formula \`${expression}\``,
  });

  const colValues = await evalFormula(expression, dataset.records);

  // Check for type errors (might throw error and abort transformer)
  await reportTypeErrorsForRecords(
    dataset.records,
    colValues,
    outputType,
    evalFormula
  );

  // add values for new attribute to all records
  const records = dataset.records.map((record, i) => {
    const recordCopy = { ...record };
    recordCopy[newAttributeName] = colValues[i];
    return recordCopy;
  });

  return {
    collections,
    records,
  };
}
