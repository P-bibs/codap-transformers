import { uncheckedAverage } from "../average";
import {
  CENSUS_DATASET,
  DATASET_A,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

test("averages small datasets", () => {
  expect(uncheckedAverage(DATASET_A, "A")).toStrictEqual(
    (3 + 8 + 10 + 4 + 10) / 5
  );
  expect(uncheckedAverage(DATASET_A, "C")).toStrictEqual(
    (2000 + 2003 + 1998 + 2010 + 2014) / 5
  );
});

test("averages larger datasets", () => {
  expect(uncheckedAverage(CENSUS_DATASET, "sample")).toStrictEqual(1);
  expect(uncheckedAverage(CENSUS_DATASET, "Year")).toStrictEqual(2017);
  expect(uncheckedAverage(CENSUS_DATASET, "Age")).toStrictEqual(
    CENSUS_DATASET.records
      .map((rec) => rec["Age"] as number)
      .reduce((a, b) => a + b) / CENSUS_DATASET.records.length
  );
});

test("errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() => uncheckedAverage(DATASET_A, "Not Here")).toThrowError(
    invalidAttributeErr
  );
  expect(() => uncheckedAverage(CENSUS_DATASET, "Height")).toThrowError(
    invalidAttributeErr
  );
});

test("errors on non-number values", () => {
  const nonNumberErr = /Expected number/;
  expect(() => uncheckedAverage(TYPES_DATASET, "String")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedAverage(TYPES_DATASET, "Boolean")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedAverage(TYPES_DATASET, "Boundary")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedAverage(TYPES_DATASET, "Color")).toThrowError(
    nonNumberErr
  );
  expect(() => uncheckedAverage(TYPES_DATASET, "Missing")).toThrowError(
    nonNumberErr
  );
});

test("errors on dataset with no records", () => {
  expect(() => uncheckedAverage(EMPTY_RECORDS, "E")).toThrowError(/no cases/);
});
