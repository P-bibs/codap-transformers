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
  textInput1: transformedAttributeName,
  name,
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
  transformedAttributeName = transformedAttributeName.trim();
  if (transformedAttributeName === "") {
    throw new Error(t("errors:transformAttribute.noTransformedAttributeName"));
  }

  const { context, dataset } = await getContextAndDataSet(contextName);
  const ctxtName = tryTitle(context);

  const [transformed, mvr] = await uncheckedTransformAttribute(
    dataset,
    attributeName,
    transformedAttributeName,
    expression,
    outputType
  );

  mvr.extraInfo = `The formula for the transformed column evaluated to a missing value for ${mvr.missingValues.length} rows.`;

  name = name || "TransformAttribute";

  return [
    transformed,
    `${name}(${ctxtName}, ...)`,
    `A copy of ${ctxtName}, with the ${attributeName} attribute transformed into ` +
      `${transformedAttributeName}, with its values determined by the formula \`${expression}\`.`,
    mvr,
  ];
}

export async function uncheckedTransformAttribute(
  dataset: DataSet,
  attributeName: string,
  transformedAttributeName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<[DataSet, MissingValueReport]> {
  validateAttribute(
    dataset.collections,
    attributeName,
    t("errors:transformAttribute.invalidAttribute", { name: attributeName })
  );

  // If they are *changing* the transformed attribute name, ensure no duplicate attr names
  if (
    transformedAttributeName != attributeName &&
    dataset.collections.find((coll) =>
      coll.attrs?.find((attr) => attr.name === transformedAttributeName)
    )
  ) {
    throw new Error(
      t("errors:validation.duplicateAttribute", {
        name: transformedAttributeName,
      })
    );
  }

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

    // Remove the previous attribute from the record, and then compute the
    // transformed attribute value. NOTE: This needs to happen in this order,
    // to prevent deleting of the transformed attribute in the case where
    // they keep the same name as the original.
    delete records[i][attributeName];
    records[i][transformedAttributeName] = value;
  });

  const collections = dataset.collections.map(cloneCollection);
  for (const coll of collections) {
    // Attempt to find the original attribute in this collection
    const attr = coll.attrs?.find((attr) => attr.name === attributeName);

    // Erase the transformed attribute's formula and set description and name
    if (attr !== undefined) {
      attr.name = transformedAttributeName;
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
