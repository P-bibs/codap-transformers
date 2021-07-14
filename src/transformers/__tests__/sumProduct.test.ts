import { uncheckedSumProduct } from "../sumProduct";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  FULLY_FEATURED_DATASET,
  TYPES_DATASET,
} from "./data";

// TODO: test that sum product ignores missing values

test("sums a single attribute", () => {
  expect(uncheckedSumProduct(DATASET_A, ["A"])).toEqual(3 + 8 + 10 + 4 + 10);
  expect(uncheckedSumProduct(DATASET_B, ["Birth_Year"])).toEqual(
    1990 + 1995 + 2001 + 2000 + 1998 + 1988
  );
  // All the records have a "Year" of 2017
  expect(uncheckedSumProduct(CENSUS_DATASET, ["Year"])).toEqual(
    2017 * CENSUS_DATASET.records.length
  );
});

test("works with multiple attributes", () => {
  expect(uncheckedSumProduct(DATASET_A, ["A", "C"])).toEqual(
    3 * 2000 + 8 * 2003 + 10 * 1998 + 4 * 2010 + 10 * 2014
  );
  expect(
    uncheckedSumProduct(DATASET_B, ["Birth_Year", "Current_Year", "Grade"])
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
  expect(() => uncheckedSumProduct(DATASET_A, [])).toThrowError(
    /zero attributes/
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() =>
    uncheckedSumProduct(CENSUS_DATASET, ["Age", "Height"])
  ).toThrowError(invalidAttributeErr);
  expect(() => uncheckedSumProduct(DATASET_B, ["Last Name"])).toThrowError(
    invalidAttributeErr
  );
});

test("errors on non-number values", () => {
  const nonNumberErr = /Expected number/;
  expect(() => uncheckedSumProduct(DATASET_A, ["A", "B"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedSumProduct(CENSUS_DATASET, ["State"])).toThrowError(
    nonNumberErr
  );
  expect(() =>
    uncheckedSumProduct(FULLY_FEATURED_DATASET, ["Attribute_3", "Attribute_1"])
  ).toThrowError(nonNumberErr);
  expect(() =>
    uncheckedSumProduct(TYPES_DATASET, ["Boolean", "Color"])
  ).toThrowError(nonNumberErr);
  expect(() => uncheckedSumProduct(TYPES_DATASET, ["String"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedSumProduct(TYPES_DATASET, ["Boolean"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedSumProduct(TYPES_DATASET, ["Boundary"])).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedSumProduct(TYPES_DATASET, ["Color"])).toThrowError(
    nonNumberErr
  );
});

test("sum product of no records / only missing values is 0", () => {
  // Dataset with no records
  expect(uncheckedSumProduct(EMPTY_RECORDS, ["B", "C"])).toEqual(0);

  // Only missing values is equivalent to no records since they are ignored.
  expect(uncheckedSumProduct(TYPES_DATASET, ["Missing"])).toEqual(0);
});
