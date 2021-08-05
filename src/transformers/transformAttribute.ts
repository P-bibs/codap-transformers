import {
  CodapLanguageType,
  DataSet,
  MissingValueReport,
  TransformationOutput,
} from "./types";
import { evalExpression, getContextAndDataSet } from "../lib/codapPhone";
import { TransformerTemplateState } from "../components/transformer-template/TransformerTemplate";
import { isMissing, tryTitle } from "./util";
import { cloneCollection, shallowCopy, validateAttribute } from "./util";
import { reportTypeErrorsForRecords } from "../lib/utils/typeChecking";
import { t } from "../strings";

/**
 * Produces a dataset with the indicated attribute's values transformed
 * to be the result of evaluating the given expression in the context
 * of each case.
 */
export async function transformAttribute({
  context1: contextName,
  attribute1: attributeName,
  expression1: expression,
  typeContract1: { outputType },
}: TransformerTemplateState): Promise<TransformationOutput> {
  if (contextName === null) {
    throw new Error(t("errors:validation.noDataSet"));
  }
  if (attributeName === null) {
    throw new Error(t("errors:transformAttribute.noAttribute"));
  }
  if (expression.trim() === "") {
    throw new Error(t("errors:transformAttribute.noExpression"));
  }
  if (outputType === null) {
    throw new Error(t("errors:transformAttribute.noOutputType"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [transformed, mvr] = await uncheckedTransformAttribute(
    dataset,
    attributeName,
    expression,
    outputType
  );

  mvr.extraInfo = `The formula for the transformed column evaluated to a missing value for ${mvr.missingValues.length} rows.`;

  return [
    transformed,
    `TransformAttribute(${ctxtName}, ...)`,
    `A copy of ${ctxtName}, with the ${attributeName} attribute's values ` +
      `determined by the formula \`${expression}\`.`,
    mvr,
  ];
}

export async function uncheckedTransformAttribute(
  dataset: DataSet,
  attributeName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<[DataSet, MissingValueReport]> {
  validateAttribute(
    dataset.collections,
    attributeName,
    t("errors:transformAttribute.invalidAttribute", { name: attributeName })
  );

  const records = dataset.records.map(shallowCopy);
  const exprValues = await evalFormula(expression, records);

  // Check for type errors (might throw error and abort transformer)
  await reportTypeErrorsForRecords(
    records,
    exprValues,
    outputType,
    evalFormula
  );

  const mvr: MissingValueReport = {
    kind: "formula",
    missingValues: [],
  };

  exprValues.forEach((value, i) => {
    // Note values for which the formula evaluated to missing
    if (isMissing(value)) {
      mvr.missingValues.push(i + 1);
    }

    records[i][attributeName] = value;
  });

  const collections = dataset.collections.map(cloneCollection);
  for (const coll of collections) {
    const attr = coll.attrs?.find((attr) => attr.name === attributeName);

    // erase the transformed attribute's formula and set description
    if (attr !== undefined) {
      attr.formula = undefined;
      attr.description = `The ${attributeName} attribute, transformed by the formula \`${expression}\``;
      break;
    }
  }

  return [
    {
      collections,
      records,
    },
    mvr,
  ];
}
