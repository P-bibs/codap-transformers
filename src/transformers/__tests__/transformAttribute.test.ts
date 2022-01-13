import { evalExpression } from "../../lib/codapPhone";
import { uncheckedTransformAttribute } from "../transformAttribute";
import { CodapLanguageType, DataSet } from "../types";
import {
  CENSUS_DATASET,
  cloneDataSet,
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_DATASET,
  jsEvalExpression,
} from "./data";

/**
 * Applies the same changes that transform attribute does to the indicated
 * attribute in the given dataset.
 *
 * @param dataset Dataset to update
 * @param name Name of attribute to update
 * @param formula Formula by which this attribute was transformed
 */
function transformAttr(dataset: DataSet, name: string, formula: string): void {
  for (const coll of dataset.collections) {
    const attr = coll.attrs?.find((attr) => attr.name === name);

    if (attr) {
      attr.formula = undefined;
      attr.description = `The ${name} attribute, transformed by the formula \`${formula}\``;
      break;
    }
  }
}

/**
 * Wrapper around transform attribute that discards missing value reports.
 */
async function uncheckedTransformAttributeWrapper(
  dataset: DataSet,
  attributeName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<DataSet> {
  const [output] = await uncheckedTransformAttribute(
    dataset,
    attributeName,
    expression,
    outputType,
    evalFormula
  );
  return output;
}

test("simple transform to constant", async () => {
  const transformedA = cloneDataSet(DATASET_A);
  transformAttr(transformedA, "B", "10");
  transformedA.records.forEach((record) => (record["B"] = 10));

  expect(
    await uncheckedTransformAttributeWrapper(
      DATASET_A,
      "B",
      "10",
      "Any",
      jsEvalExpression
    )
  ).toEqual(transformedA);
});

test("transform with formula dependent on transformed attribute", async () => {
  const transformedB = cloneDataSet(DATASET_B);
  transformAttr(transformedB, "Birth_Year", "Birth_Year + 1");
  transformedB.records.forEach((record) => (record["Birth_Year"] as number)++);

  expect(
    await uncheckedTransformAttributeWrapper(
      DATASET_B,
      "Birth_Year",
      "Birth_Year + 1",
      "Any",
      jsEvalExpression
    )
  ).toEqual(transformedB);
});

test("transform with formula dependent on other attribute", async () => {
  const transformedCensus = cloneDataSet(CENSUS_DATASET);
  transformAttr(transformedCensus, "sample", "Age > 30");
  transformedCensus.records.forEach(
    (record) => (record["sample"] = (record["Age"] as number) > 30)
  );

  expect(
    await uncheckedTransformAttributeWrapper(
      CENSUS_DATASET,
      "sample",
      "Age > 30",
      "Any",
      jsEvalExpression
    )
  ).toEqual(transformedCensus);
});

test("errors on invalid attribute", async () => {
  const invalidAttributeErr = /was not found/;
  expect.assertions(3);

  try {
    await uncheckedTransformAttributeWrapper(
      CENSUS_DATASET,
      "Unknown",
      "Year * 2",
      "Number",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(invalidAttributeErr);
  }

  try {
    await uncheckedTransformAttributeWrapper(
      DATASET_A,
      "Z",
      "A + C",
      "Number",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(invalidAttributeErr);
  }
  try {
    await uncheckedTransformAttributeWrapper(
      EMPTY_DATASET,
      "Anything",
      "0",
      "Number",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch(invalidAttributeErr);
  }
});

test("metadata (besides formula/description of transformed attr) is copied", async () => {
  const transformedMeta = cloneDataSet(DATASET_WITH_META);
  transformAttr(transformedMeta, "C", "true");

  expect(
    await uncheckedTransformAttributeWrapper(
      DATASET_WITH_META,
      "C",
      "true",
      "Boolean",
      jsEvalExpression
    )
  ).toEqual(transformedMeta);
});
