import {
  CodapLanguageType,
  DataSet,
  MissingValueReport,
  TransformationOutput,
} from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone/index";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { isMissing, tryTitle } from "../transformers/util";
import { cloneCollection } from "./util";
import { reportTypeErrorsForRecords } from "../lib/utils/typeChecking";
import { t } from "../strings";

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export async function buildAttribute({
  context1: contextName,
  collection1: collectionName,
  textInput1: attributeName,
  expression1: expression,
  typeContract1: { outputType },
  name,
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (collectionName === null) {
    throw new Error(t("errors:buildAttribute.noCollection"));
  }
  if (attributeName.trim() === "") {
    throw new Error(t("errors:buildAttribute.noAttribute"));
  }
  if (expression.trim() === "") {
    throw new Error(t("errors:buildAttribute.noExpression"));
  }
  if (outputType === null) {
    throw new Error(t("errors:buildAttribute.noOutputType"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [withColumn, mvr] = await uncheckedBuildAttribute(
    dataset,
    attributeName,
    collectionName,
    expression,
    outputType
  );

  mvr.extraInfo = `The formula for the new column evaluated to a missing value for ${mvr.missingValues.length} rows.`;

  name = name || "BuildAttribute";

  return [
    withColumn,
    `${name}(${ctxtName}, ...)`,
    `A copy of ${ctxtName} with a new attribute (${attributeName}) added to ` +
      `the ${collectionName} collection, whose value is determined by the formula \`${expression}\`.`,
    mvr,
  ];
}

/**
 * Builds a dataset with a new attribute added to one of the collections,
 * whose case values are computed by evaluating the given expression.
 */
export async function uncheckedBuildAttribute(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<[DataSet, MissingValueReport]> {
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

  const mvr: MissingValueReport = {
    kind: "formula",
    missingValues: [],
  };

  // add values for new attribute to all records
  const records = dataset.records.map((record, i) => {
    const recordCopy = { ...record };
    recordCopy[newAttributeName] = colValues[i];

    // If formula evaluated to missing value, record in MVR
    if (isMissing(recordCopy[newAttributeName])) {
      mvr.missingValues.push(i + 1);
    }

    return recordCopy;
  });

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}
