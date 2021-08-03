import { uncheckedStandardDeviation } from "../standardDeviation";
import { DataSet } from "../types";
import {
  CENSUS_DATASET,
  datasetFromValues,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

/**
 * A wrapper around unchecked std dev that discards the missing value report.
 */
function uncheckedStandardDeviationWrapper(
  contextName: string,
  dataset: DataSet,
  attribute: string
): number {
  const [output] = uncheckedStandardDeviation(contextName, dataset, attribute);
  return output;
}

test("std deviation of small datasets", () => {
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([105, 78]),
      "Attribute"
    )
  ).toEqual(13.5);
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([98, -10, 4, 2, 3, 3, 11]),
      "Attribute"
    )
  ).toBeCloseTo(34.0228, 5);
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([1000, 9, -51, 18, -111, 41, 55, 89, 111, -22, -43]),
      "Attribute"
    )
  ).toBeCloseTo(291.29906, 5);
  expect(
    uncheckedStandardDeviationWrapper("Dataset A", DATASET_A, "A")
  ).toBeCloseTo(2.96648, 5);
});

test("std deviation of all same value is 0", () => {
  expect(
    uncheckedStandardDeviationWrapper("Dataset B", DATASET_B, "Current_Year")
  ).toEqual(0);
  expect(
    uncheckedStandardDeviationWrapper("Census Dataset", CENSUS_DATASET, "Year")
  ).toEqual(0);
});

test("std deviation of single value is 0", () => {
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([40]),
      "Attribute"
    )
  ).toEqual(0);
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([-100]),
      "Attribute"
    )
  ).toEqual(0);
});

test("std deviation errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() =>
    uncheckedStandardDeviationWrapper(
      "Dataset A",
      DATASET_A,
      "Nonexistent Attribute"
    )
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedStandardDeviationWrapper(
      "Census Dataset",
      CENSUS_DATASET,
      "Years Old"
    )
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedStandardDeviationWrapper(
      "Empty records",
      EMPTY_RECORDS,
      "Some Attribute"
    )
  ).toThrowError(invalidAttributeErr);
});

test("std deviation errors on non-numeric value in input", () => {
  const nonNumericErr = /Expected number, instead got/;

  expect(() =>
    uncheckedStandardDeviationWrapper("Types Dataset", TYPES_DATASET, "String")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedStandardDeviationWrapper("Types Dataset", TYPES_DATASET, "Boolean")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedStandardDeviationWrapper(
      "Types Dataset",
      TYPES_DATASET,
      "Boundary"
    )
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedStandardDeviationWrapper("Types Dataset", TYPES_DATASET, "Color")
  ).toThrowError(nonNumericErr);
});

test("std deviation errors on no values given", () => {
  const noNumericValuesErr = /no values/;
  expect(() =>
    uncheckedStandardDeviationWrapper("Empty Records", EMPTY_RECORDS, "A")
  ).toThrowError(noNumericValuesErr);

  // Missing values are ignored so this is effectively an empty input
  expect(() =>
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues(["", "", "", ""]),
      "Attribute"
    )
  ).toThrowError(noNumericValuesErr);
});

test("std deviation ignores missing values", () => {
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues(["", "", "", 5, ""]),
      "Attribute"
    )
  ).toEqual(0);
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues(["", 2, "", 11, -40, 18, "", 211]),
      "Attribute"
    )
  ).toBeCloseTo(87.64611, 5);
  expect(
    uncheckedStandardDeviationWrapper(
      "Dataset",
      datasetFromValues([
        1000,
        9,
        "",
        -51,
        18,
        -111,
        "",
        "",
        41,
        55,
        89,
        "",
        111,
        -22,
        -43,
      ]),
      "Attribute"
    )
  ).toBeCloseTo(291.29906, 5);
});
