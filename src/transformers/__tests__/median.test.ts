import { uncheckedMedian } from "../median";
import { DataSet } from "../types";
import {
  datasetFromValues,
  CENSUS_DATASET,
  DATASET_B,
  DATASET_WITH_MISSING,
  EMPTY_DATASET,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  TYPES_DATASET,
} from "./data";

function uncheckedMedianWrapper(
  contextName: string,
  dataset: DataSet,
  attribute: string
): number {
  const [output] = uncheckedMedian(contextName, dataset, attribute);
  return output;
}

test("median chooses center value of sorted values when odd length", () => {
  expect(
    uncheckedMedianWrapper("Dataset", datasetFromValues([2, 3, 1]), "Attribute")
  ).toEqual(2);
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([6, 19, 21, 1, 1]),
      "Attribute"
    )
  ).toEqual(6);
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([100, 18, -16, 31, 100, 12, 18]),
      "Attribute"
    )
  ).toEqual(18);
});

test("median of single value is that value", () => {
  expect(
    uncheckedMedianWrapper("Dataset", datasetFromValues([40]), "Attribute")
  ).toEqual(40);
  expect(
    uncheckedMedianWrapper("Dataset", datasetFromValues([0]), "Attribute")
  ).toEqual(0);
});

test("median averages middle values when even length", () => {
  expect(
    uncheckedMedianWrapper("Dataset", datasetFromValues([2, 1]), "Attribute")
  ).toEqual((2 + 1) / 2);
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([8, -4, 10, 16]),
      "Attribute"
    )
  ).toEqual((8 + 10) / 2);
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([1, 3, 3, -5, 1, 11, 41, 0]),
      "Attribute"
    )
  ).toEqual((1 + 3) / 2);
});

test("median errors on non-numeric, non-missing values", () => {
  const nonNumericErr = /Expected number, instead got/;
  expect(() =>
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([4, -7, "string", 11, true]),
      "Attribute"
    )
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedMedianWrapper("Types Dataset", TYPES_DATASET, "String")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedMedianWrapper("Types Dataset", TYPES_DATASET, "Boolean")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedMedianWrapper("Types Dataset", TYPES_DATASET, "Boundary")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedMedianWrapper("Types Dataset", TYPES_DATASET, "Color")
  ).toThrowError(nonNumericErr);
});

test("median errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;

  expect(() =>
    uncheckedMedianWrapper("Census Dataset", CENSUS_DATASET, "Bad Attribute")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedMedianWrapper("Dataset B", DATASET_B, "Last Name")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedMedianWrapper(
      "Fully-featured dataset",
      FULLY_FEATURED_DATASET,
      "Attribute_0"
    )
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedMedianWrapper("Empty Dataset", EMPTY_DATASET, "Any attribute")
  ).toThrowError(invalidAttributeErr);
});

test("median ignores missing values", () => {
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues([4, "", 1, 1, "", "", 9]),
      "Attribute"
    )
  ).toEqual((1 + 4) / 2);
  expect(
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues(["", "", "", "", "", 20, "", ""]),
      "Attribute"
    )
  ).toEqual(20);
  expect(
    uncheckedMedianWrapper("Dataset with Missing", DATASET_WITH_MISSING, "A")
  ).toEqual((5 + 6) / 2);
  expect(
    uncheckedMedianWrapper("Dataset with Missing", DATASET_WITH_MISSING, "B")
  ).toEqual(2);
  expect(
    uncheckedMedianWrapper("Dataset with Missing", DATASET_WITH_MISSING, "C")
  ).toEqual((3 + 4) / 2);
});

test("median errors on no numeric values given", () => {
  const noNumericErr = /no numeric values/;
  expect(() =>
    uncheckedMedianWrapper("Empty Records", EMPTY_RECORDS, "E")
  ).toThrowError(noNumericErr);

  // Missing values will be ignored so there are effectively no values here
  expect(() =>
    uncheckedMedianWrapper(
      "Dataset",
      datasetFromValues(["", "", "", "", ""]),
      "Attribute"
    )
  ).toThrowError(noNumericErr);
});
