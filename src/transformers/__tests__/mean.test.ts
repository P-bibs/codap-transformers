import { uncheckedMean } from "../mean";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_WITH_MISSING,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

test("averages small datasets", () => {
  expect(uncheckedMean(DATASET_A, "A")).toStrictEqual(
    (3 + 8 + 10 + 4 + 10) / 5
  );
  expect(uncheckedMean(DATASET_A, "C")).toStrictEqual(
    (2000 + 2003 + 1998 + 2010 + 2014) / 5
  );
});

test("averages larger datasets", () => {
  expect(uncheckedMean(CENSUS_DATASET, "sample")).toStrictEqual(1);
  expect(uncheckedMean(CENSUS_DATASET, "Year")).toStrictEqual(2017);
  expect(uncheckedMean(CENSUS_DATASET, "Age")).toStrictEqual(
    CENSUS_DATASET.records
      .map((rec) => rec["Age"] as number)
      .reduce((a, b) => a + b) / CENSUS_DATASET.records.length
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() => uncheckedMean(DATASET_A, "Not Here")).toThrowError(
    invalidAttributeErr
  );
  expect(() => uncheckedMean(CENSUS_DATASET, "Height")).toThrowError(
    invalidAttributeErr
  );
});

test("errors on non-number values", () => {
  const nonNumberErr = /Expected number/;
  expect(() => uncheckedMean(TYPES_DATASET, "String")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedMean(TYPES_DATASET, "Boolean")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedMean(TYPES_DATASET, "Boundary")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedMean(TYPES_DATASET, "Color")).toThrowError(
    nonNumberErr
  );
});

test("errors when no values or only missing values provided", () => {
  const noNumericValuesErr = /no numeric values/;
  // No records at all
  expect(() => uncheckedMean(EMPTY_RECORDS, "E")).toThrowError(
    noNumericValuesErr
  );

  // Only missing values
  expect(() => uncheckedMean(TYPES_DATASET, "Missing")).toThrowError(
    noNumericValuesErr
  );
});

test("ignores missing values", () => {
  expect(uncheckedMean(DATASET_WITH_MISSING, "A")).toEqual(
    (6 + 3 + 10 + 5) / 4
  );

  expect(uncheckedMean(DATASET_WITH_MISSING, "B")).toEqual((12 + 2 + 2) / 3);

  expect(uncheckedMean(DATASET_WITH_MISSING, "C")).toEqual(
    (10 + 1 + 4 + 3) / 4
  );
});

test("allows numeric strings", () => {
  expect(uncheckedMean(TYPES_DATASET, "NumericString")).toEqual(11);
});

test("allow negative numbers and decimals", () => {
  expect(uncheckedMean(TYPES_DATASET, "Number")).toBeCloseTo(245.066666667);
});
