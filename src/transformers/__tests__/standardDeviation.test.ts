import { uncheckedStandardDeviation } from "../standardDeviation";
import {
  CENSUS_DATASET,
  datasetFromValues,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  TYPES_DATASET,
} from "./data";

test("std deviation of small datasets", () => {
  expect(
    uncheckedStandardDeviation(datasetFromValues([105, 78]), "Attribute")
  ).toEqual(13.5);
  expect(
    uncheckedStandardDeviation(
      datasetFromValues([98, -10, 4, 2, 3, 3, 11]),
      "Attribute"
    )
  ).toBeCloseTo(34.0228, 5);
  expect(
    uncheckedStandardDeviation(
      datasetFromValues([1000, 9, -51, 18, -111, 41, 55, 89, 111, -22, -43]),
      "Attribute"
    )
  ).toBeCloseTo(291.29906, 5);
  expect(uncheckedStandardDeviation(DATASET_A, "A")).toBeCloseTo(2.96648, 5);
});

test("std deviation of all same value is 0", () => {
  expect(uncheckedStandardDeviation(DATASET_B, "Current_Year")).toEqual(0);
  expect(uncheckedStandardDeviation(CENSUS_DATASET, "Year")).toEqual(0);
});

test("std deviation of single value is 0", () => {
  expect(
    uncheckedStandardDeviation(datasetFromValues([40]), "Attribute")
  ).toEqual(0);
  expect(
    uncheckedStandardDeviation(datasetFromValues([-100]), "Attribute")
  ).toEqual(0);
});

test("std deviation errors on invalid attribute", () => {
  const invalidAttributeErr = /Invalid attribute/;
  expect(() =>
    uncheckedStandardDeviation(DATASET_A, "Nonexistent Attribute")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedStandardDeviation(CENSUS_DATASET, "Years Old")
  ).toThrowError(invalidAttributeErr);
  expect(() =>
    uncheckedStandardDeviation(EMPTY_RECORDS, "Some Attribute")
  ).toThrowError(invalidAttributeErr);
});

test("std deviation errors on non-numeric value in input", () => {
  const nonNumericErr = /Expected number, instead got/;

  expect(() =>
    uncheckedStandardDeviation(TYPES_DATASET, "String")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedStandardDeviation(TYPES_DATASET, "Boolean")
  ).toThrowError(nonNumericErr);
  expect(() =>
    uncheckedStandardDeviation(TYPES_DATASET, "Boundary")
  ).toThrowError(nonNumericErr);
  expect(() => uncheckedStandardDeviation(TYPES_DATASET, "Color")).toThrowError(
    nonNumericErr
  );
});

test("std deviation errors on no values given", () => {
  const noNumericValuesErr = /no values/;
  expect(() => uncheckedStandardDeviation(EMPTY_RECORDS, "A")).toThrowError(
    noNumericValuesErr
  );

  // Missing values are ignored so this is effectively an empty input
  expect(() =>
    uncheckedStandardDeviation(datasetFromValues(["", "", "", ""]), "Attribute")
  ).toThrowError(noNumericValuesErr);
});

test("std deviation ignores missing values", () => {
  expect(
    uncheckedStandardDeviation(
      datasetFromValues(["", "", "", 5, ""]),
      "Attribute"
    )
  ).toEqual(0);
  expect(
    uncheckedStandardDeviation(
      datasetFromValues(["", 2, "", 11, -40, 18, "", 211]),
      "Attribute"
    )
  ).toBeCloseTo(87.64611, 5);
  expect(
    uncheckedStandardDeviation(
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
