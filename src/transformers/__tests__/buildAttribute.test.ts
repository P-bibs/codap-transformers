import { evalExpression } from "../../lib/codapPhone";
import { uncheckedBuildAttribute } from "../buildAttribute";
import { CodapLanguageType, DataSet } from "../types";
import {
  CENSUS_DATASET,
  cloneDataSet,
  DATASET_A,
  DATASET_WITH_META,
  EMPTY_RECORDS,
  jsEvalExpression,
} from "./data";

/**
 * Wrapper around uncheckedBuildAttribute which extracts just the dataset
 * output and ignores the missing value report.
 */
async function uncheckedBuildAttributeWrapper(
  dataset: DataSet,
  newAttributeName: string,
  collectionName: string,
  expression: string,
  outputType: CodapLanguageType,
  evalFormula = evalExpression
): Promise<DataSet> {
  const [output] = await uncheckedBuildAttribute(
    dataset,
    newAttributeName,
    collectionName,
    expression,
    outputType,
    evalFormula
  );
  return output;
}

test("throws error when non-existent collection given", () => {
  expect.assertions(1);
  return uncheckedBuildAttributeWrapper(
    DATASET_A,
    "New Col",
    "not here",
    "C + 1",
    "Number"
  ).catch((e) => expect(e.message).toMatch(/was not found/));
});

test("throws error when new attribute collides with existing", () => {
  expect.assertions(1);
  return uncheckedBuildAttributeWrapper(
    DATASET_A,
    "A",
    "child",
    "C + 1",
    "Number"
  ).catch((e) => expect(e.message).toMatch(/already in use/));
});

test("throws error when expression uses unbound values", async () => {
  try {
    await uncheckedBuildAttributeWrapper(
      DATASET_A,
      "E",
      "child",
      "AttributeNameThatDoesntExist + 1",
      "Any",
      jsEvalExpression
    );
  } catch (e) {
    expect(e.message).toMatch("AttributeNameThatDoesntExist");
  }
});

test("using attribute name as formula creates clone of attribute", async () => {
  expect(
    (
      await uncheckedBuildAttributeWrapper(
        DATASET_A,
        "D",
        "child",
        "C",
        "Any",
        jsEvalExpression
      )
    ).records.map((row) => row.D)
  ).toEqual(DATASET_A.records.map((row) => row.C));
});

test("build attribute does nothing to dataset with no records", async () => {
  const COLLECTION_A_OUTPUT = cloneDataSet(EMPTY_RECORDS);
  COLLECTION_A_OUTPUT.collections[0].attrs?.push({
    description:
      "An attribute whose values were computed with the formula `A + B * F + 1`",
    name: "G",
  });
  expect(
    await uncheckedBuildAttributeWrapper(
      EMPTY_RECORDS,
      "G",
      "Collection A",
      "A + B * F + 1",
      "Any",
      jsEvalExpression
    )
  ).toEqual(COLLECTION_A_OUTPUT);

  const COLLECTION_B_OUTPUT = cloneDataSet(EMPTY_RECORDS);
  COLLECTION_B_OUTPUT.collections[1].attrs?.push({
    description:
      "An attribute whose values were computed with the formula `A + B * F + 1`",
    name: "G",
  });
  expect(
    await uncheckedBuildAttributeWrapper(
      EMPTY_RECORDS,
      "G",
      "Collection B",
      "A + B * F + 1",
      "Any",
      jsEvalExpression
    )
  ).toEqual(COLLECTION_B_OUTPUT);

  const COLLECTION_C_OUTPUT = cloneDataSet(EMPTY_RECORDS);
  COLLECTION_C_OUTPUT.collections[2].attrs?.push({
    description:
      "An attribute whose values were computed with the formula `A + B * F + 1`",
    name: "G",
  });
  expect(
    await uncheckedBuildAttributeWrapper(
      EMPTY_RECORDS,
      "G",
      "Collection C",
      "A + B * F + 1",
      "Any",
      jsEvalExpression
    )
  ).toEqual(COLLECTION_C_OUTPUT);
});

test("using attribute name as formula creates clone of attribute", async () => {
  const CENSUS_DATASET_OUTPUT = cloneDataSet(CENSUS_DATASET);
  CENSUS_DATASET_OUTPUT.collections[1].attrs?.push({
    name: "BirthYear",
    description:
      "An attribute whose values were computed with the formula `Year - Age`",
  });
  CENSUS_DATASET_OUTPUT.records.forEach(
    (row) => (row["BirthYear"] = row["Year"] - row["Age"])
  );

  expect(
    await uncheckedBuildAttributeWrapper(
      CENSUS_DATASET,
      "BirthYear",
      "people",
      "Year - Age",
      "Any",
      jsEvalExpression
    )
  ).toEqual(CENSUS_DATASET_OUTPUT);
});

test("all attribute metadata is copied", async () => {
  const OUTPUT = cloneDataSet(DATASET_WITH_META);
  OUTPUT.collections[0].attrs?.push({
    description:
      'An attribute whose values were computed with the formula `""`',
    name: "D",
  });
  expect(
    await uncheckedBuildAttributeWrapper(
      DATASET_WITH_META,
      "D",
      "Collection",
      '""',
      "Any",
      jsEvalExpression
    )
  ).toEqual(OUTPUT);
});
