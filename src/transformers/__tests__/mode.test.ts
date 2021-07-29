import { uncheckedMode } from "../mode";
import { DataSet } from "../types";
import {
  CENSUS_DATASET,
  datasetFromValues,
  DATASET_A,
  DATASET_B,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

function uncheckedModeWrapper(
  contextName: string,
  dataset: DataSet,
  attribute: string
): number[] {
  const [output] = uncheckedMode(contextName, dataset, attribute);
  return output;
}

test("mode with single most frequent value", () => {
  expect(
    uncheckedModeWrapper(
      "Dataset",
      datasetFromValues([4, 2, 2, 2, 7]),
      "Attribute"
    )
  ).toEqual([2]);
  expect(
    uncheckedModeWrapper(
      "Dataset",
      datasetFromValues([100, -5, 14, -5, 8, 8, 8, -5, 12, -5]),
      "Attribute"
    )
  ).toEqual([-5]);
  expect(
    uncheckedModeWrapper(
      "Dataset",
      datasetFromValues([0, 18, 0, 0, 0, 10]),
      "Attribute"
    )
  ).toEqual([0]);
});

test("mode with multiple most frequent values", () => {
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues([14, 14, 3, 14, 11, 2, 11, 9, 11]),
        "Attribute"
      )
    )
  ).toEqual(new Set([14, 11]));
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues([5, 4, 3, 2, 1]),
        "Attribute"
      )
    )
  ).toEqual(new Set([5, 4, 3, 2, 1]));
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues([9, -3, 4, -3, -3, 4, -3, 9, -3, 9, 9, 9]),
        "Attribute"
      )
    )
  ).toEqual(new Set([9, -3]));
});

test("mode of single value is list containing that value", () => {
  expect(
    new Set(
      uncheckedModeWrapper("Dataset", datasetFromValues([100]), "Attribute")
    )
  ).toEqual(new Set([100]));
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues([4, 4, 4, 4, 4]),
        "Attribute"
      )
    )
  ).toEqual(new Set([4]));
});

test("mode errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() => uncheckedModeWrapper("Dataset A", DATASET_A, "Z")).toThrowError(
    invalidAttributeErr
  );
  expect(() =>
    uncheckedModeWrapper("Dataset B", DATASET_B, "Bad attribute name")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedModeWrapper("Census Dataset", CENSUS_DATASET, "Date of Birth")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedModeWrapper("Empty Dataset", EMPTY_DATASET, "Some attribute")
  ).toThrowError(invalidAttributeErr);
});

test("mode errors on non-numeric values", () => {
  const nonNumericErr = /Expected number, instead got/;
  expect(() =>
    uncheckedModeWrapper("Types Dataset", TYPES_DATASET, "String")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedModeWrapper("Types Dataset", TYPES_DATASET, "Boolean")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedModeWrapper("Types Dataset", TYPES_DATASET, "Boundary")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedModeWrapper("Types Dataset", TYPES_DATASET, "Color")
  ).toThrowError(nonNumericErr);
});

test("mode errors on no numeric values given", () => {
  const noNumericValuesErr = /no numeric values/;
  expect(() =>
    uncheckedModeWrapper("Empty records", EMPTY_RECORDS, "E")
  ).toThrowError(noNumericValuesErr);

  // Missing values are ignored, so this is effectively no values
  expect(() =>
    uncheckedModeWrapper("Types dataset", TYPES_DATASET, "Missing")
  ).toThrowError(noNumericValuesErr);
});

test("mode ignores missing values", () => {
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues(["", "", 2, "", 3, "", 2, 2]),
        "Attribute"
      )
    )
  ).toEqual(new Set([2]));
  expect(
    new Set(
      uncheckedModeWrapper(
        "Dataset",
        datasetFromValues([17, "", "", 13, 100, "", 41, ""]),
        "Attribute"
      )
    )
  ).toEqual(new Set([17, 13, 100, 41]));
});
