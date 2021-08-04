import { uncheckedSumProduct } from "../sumProduct";
import { DataSet } from "../types";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_B,
  DATASET_WITH_MISSING,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  TYPES_DATASET,
} from "./data";

/**
 * A wrapper around unchecked sum product which discards the missing value report.
 */
function uncheckedSumProductWrapper(
  contextTitle: string,
  dataset: DataSet,
  attributes: string[]
): number {
  const [output] = uncheckedSumProduct(contextTitle, dataset, attributes);
  return output;
}

test("sums a single attribute", () => {
  expect(uncheckedSumProductWrapper("Dataset A", DATASET_A, ["A"])).toEqual(
    3 + 8 + 10 + 4 + 10
  );
  expect(
    uncheckedSumProductWrapper("Dataset B", DATASET_B, ["Birth_Year"])
  ).toEqual(1990 + 1995 + 2001 + 2000 + 1998 + 1988);
  // All the records have a "Year" of 2017
  expect(
    uncheckedSumProductWrapper("Census Dataset", CENSUS_DATASET, ["Year"])
  ).toEqual(2017 * CENSUS_DATASET.records.length);
});

test("works with multiple attributes", () => {
  expect(
    uncheckedSumProductWrapper("Dataset A", DATASET_A, ["A", "C"])
  ).toEqual(3 * 2000 + 8 * 2003 + 10 * 1998 + 4 * 2010 + 10 * 2014);
  expect(
    uncheckedSumProductWrapper("Dataset B", DATASET_B, [
      "Birth_Year",
      "Current_Year",
      "Grade",
    ])
  ).toEqual(
    1990 * 2021 * 88 +
      1995 * 2021 * 91 +
      2001 * 2021 * 100 +
      2000 * 2021 * 93 +
      1998 * 2021 * 95 +
      1988 * 2021 * 81
  );
});

test("errors on no attributes given", () => {
  expect(() =>
    uncheckedSumProductWrapper("Dataset A", DATASET_A, [])
  ).toThrowError(/zero attributes/);
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /was not found/;
  expect(() =>
    uncheckedSumProductWrapper("Census Dataset", CENSUS_DATASET, [
      "Age",
      "Height",
    ])
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedSumProductWrapper("Dataset B", DATASET_B, ["Last Name"])
  ).toThrowError(invalidAttributeErr);
});

test("errors on non-number values", () => {
  const nonNumberErr = /Please /;
  expect(() =>
    uncheckedSumProductWrapper("Dataset A", DATASET_A, ["A", "B"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Census Dataset", CENSUS_DATASET, ["State"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper(
      "Fully-featured Dataset",
      FULLY_FEATURED_DATASET,
      ["Attribute_3", "Attribute_1"]
    )
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, [
      "Boolean",
      "Color",
    ])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, ["String"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, ["Boolean"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, ["Boundary"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, ["Color"])
  ).toThrowError(nonNumberErr);
});

test("sum product of no records / only missing values is 0", () => {
  // Dataset with no records
  expect(
    uncheckedSumProductWrapper("Empty Records", EMPTY_RECORDS, ["B", "C"])
  ).toEqual(0);

  // Only missing values is equivalent to no records since they are ignored.
  expect(
    uncheckedSumProductWrapper("Types Dataset", TYPES_DATASET, ["Missing"])
  ).toEqual(0);
});

test("ignores rows containing missing values", () => {
  expect(
    uncheckedSumProductWrapper("Dataset with Missing", DATASET_WITH_MISSING, [
      "C",
    ])
  ).toEqual(10 + 1 + 4 + 3);

  expect(
    uncheckedSumProductWrapper("Dataset with Missing", DATASET_WITH_MISSING, [
      "A",
      "B",
    ])
  ).toEqual(3 * 12 + 10 * 2 + 5 * 2);

  expect(
    uncheckedSumProductWrapper("Dataset with Missing", DATASET_WITH_MISSING, [
      "A",
      "B",
      "C",
    ])
  ).toEqual(3 * 12 * 1 + 5 * 2 * 3);
});
