import { uncheckedMean } from "../mean";
import { DataSet } from "../types";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_WITH_MISSING,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

/**
 * A wrapper around unchecked mean that discards the missing value report.
 */
export function uncheckedMeanWrapper(
  contextTitle: string,
  dataset: DataSet,
  attribute: string
): number {
  const [output] = uncheckedMean(contextTitle, dataset, attribute);
  return output;
}

test("averages small datasets", () => {
  expect(uncheckedMeanWrapper("Dataset A", DATASET_A, "A")).toStrictEqual(
    (3 + 8 + 10 + 4 + 10) / 5
  );
  expect(uncheckedMeanWrapper("Dataset A", DATASET_A, "C")).toStrictEqual(
    (2000 + 2003 + 1998 + 2010 + 2014) / 5
  );
});

test("averages larger datasets", () => {
  expect(
    uncheckedMeanWrapper("Census Dataset", CENSUS_DATASET, "sample")
  ).toStrictEqual(1);
  expect(
    uncheckedMeanWrapper("Census Dataset", CENSUS_DATASET, "Year")
  ).toStrictEqual(2017);
  expect(
    uncheckedMeanWrapper("Census Dataset", CENSUS_DATASET, "Age")
  ).toStrictEqual(
    CENSUS_DATASET.records
      .map((rec) => rec["Age"] as number)
      .reduce((a, b) => a + b) / CENSUS_DATASET.records.length
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /was not found/;
  expect(() =>
    uncheckedMeanWrapper("Dataset A", DATASET_A, "Not Here")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedMeanWrapper("Census Dataset", CENSUS_DATASET, "Height")
  ).toThrowError(invalidAttributeErr);
});

test("errors on non-number values", () => {
  const nonNumberErr = /Expected number/;
  expect(() =>
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "String")
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "Boolean")
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "Boundary")
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "Color")
  ).toThrowError(nonNumberErr);
});

test("errors when no values or only missing values provided", () => {
  const noNumericValuesErr = /no values/;
  // No records at all
  expect(() =>
    uncheckedMeanWrapper("Empty Records", EMPTY_RECORDS, "E")
  ).toThrowError(noNumericValuesErr);

  // Only missing values
  expect(() =>
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "Missing")
  ).toThrowError(noNumericValuesErr);
});

test("ignores missing values", () => {
  expect(
    uncheckedMeanWrapper("Dataset with Missing", DATASET_WITH_MISSING, "A")
  ).toEqual((6 + 3 + 10 + 5) / 4);

  expect(
    uncheckedMeanWrapper("Dataset with Missing", DATASET_WITH_MISSING, "B")
  ).toEqual((12 + 2 + 2) / 3);

  expect(
    uncheckedMeanWrapper("Dataset with Missing", DATASET_WITH_MISSING, "C")
  ).toEqual((10 + 1 + 4 + 3) / 4);
});

test("allows numeric strings", () => {
  expect(
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "NumericString")
  ).toEqual(11);
});

test("allow negative numbers and decimals", () => {
  expect(
    uncheckedMeanWrapper("Types Dataset", TYPES_DATASET, "Number")
  ).toBeCloseTo(245.066666667);
});
