import { uncheckedMedian } from "../median";
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

test("median chooses center value of sorted values when odd length", () => {
  expect(uncheckedMedian(datasetFromValues([2, 3, 1]), "Attribute")).toEqual(2);
  expect(
    uncheckedMedian(datasetFromValues([6, 19, 21, 1, 1]), "Attribute")
  ).toEqual(6);
  expect(
    uncheckedMedian(
      datasetFromValues([100, 18, -16, 31, 100, 12, 18]),
      "Attribute"
    )
  ).toEqual(18);
});

test("median of single value is that value", () => {
  expect(uncheckedMedian(datasetFromValues([40]), "Attribute")).toEqual(40);
  expect(uncheckedMedian(datasetFromValues([0]), "Attribute")).toEqual(0);
});

test("median averages middle values when even length", () => {
  expect(uncheckedMedian(datasetFromValues([2, 1]), "Attribute")).toEqual(
    (2 + 1) / 2
  );
  expect(
    uncheckedMedian(datasetFromValues([8, -4, 10, 16]), "Attribute")
  ).toEqual((8 + 10) / 2);
  expect(
    uncheckedMedian(datasetFromValues([1, 3, 3, -5, 1, 11, 41, 0]), "Attribute")
  ).toEqual((1 + 3) / 2);
});

test("median errors on non-numeric, non-missing values", () => {
  const nonNumericErr = /Expected number, instead got/;
  expect(() =>
    uncheckedMedian(datasetFromValues([4, -7, "string", 11, true]), "Attribute")
  ).toThrowError(nonNumericErr);
  expect(() => uncheckedMedian(TYPES_DATASET, "String")).toThrowError(
    nonNumericErr
  );
  expect(() => uncheckedMedian(TYPES_DATASET, "Boolean")).toThrowError(
    nonNumericErr
  );
  expect(() => uncheckedMedian(TYPES_DATASET, "Boundary")).toThrowError(
    nonNumericErr
  );
  expect(() => uncheckedMedian(TYPES_DATASET, "Color")).toThrowError(
    nonNumericErr
  );
});

test("median errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;

  expect(() => uncheckedMedian(CENSUS_DATASET, "Bad Attribute")).toThrowError(
    invalidAttributeErr
  );
  expect(() => uncheckedMedian(DATASET_B, "Last Name")).toThrowError(
    invalidAttributeErr
  );
  expect(() =>
    uncheckedMedian(FULLY_FEATURED_DATASET, "Attribute_0")
  ).toThrowError(invalidAttributeErr);
  expect(() => uncheckedMedian(EMPTY_DATASET, "Any attribute")).toThrowError(
    invalidAttributeErr
  );
});

test("median ignores missing values", () => {
  expect(
    uncheckedMedian(datasetFromValues([4, "", 1, 1, "", "", 9]), "Attribute")
  ).toEqual((1 + 4) / 2);
  expect(
    uncheckedMedian(
      datasetFromValues(["", "", "", "", "", 20, "", ""]),
      "Attribute"
    )
  ).toEqual(20);
  expect(uncheckedMedian(DATASET_WITH_MISSING, "A")).toEqual((5 + 6) / 2);
  expect(uncheckedMedian(DATASET_WITH_MISSING, "B")).toEqual(2);
  expect(uncheckedMedian(DATASET_WITH_MISSING, "C")).toEqual((3 + 4) / 2);
});

test("median errors on no values given", () => {
  const noNumericErr = /no values/;
  expect(() => uncheckedMedian(EMPTY_RECORDS, "E")).toThrowError(noNumericErr);

  // Missing values will be ignored so there are effectively no values here
  expect(() =>
    uncheckedMedian(datasetFromValues(["", "", "", "", ""]), "Attribute")
  ).toThrowError(noNumericErr);
});
