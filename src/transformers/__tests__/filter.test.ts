import { uncheckedFilter } from "../filter";
import {
  CENSUS_DATASET,
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_RECORDS,
  jsEvalExpression,
  makeCollection,
  makeRecords,
  TYPES_DATASET,
} from "./data";

test("filtering with true predicate returns input dataset", async () => {
  expect(await uncheckedFilter(DATASET_A, "true", jsEvalExpression)).toEqual(
    DATASET_A
  );
  expect(
    await uncheckedFilter(CENSUS_DATASET, "true", jsEvalExpression)
  ).toEqual(CENSUS_DATASET);
});

test("filtering with false predicate returns no records", async () => {
  expect(await uncheckedFilter(DATASET_B, "false", jsEvalExpression)).toEqual({
    ...DATASET_B,
    records: [],
  });
  expect(
    await uncheckedFilter(CENSUS_DATASET, "false", jsEvalExpression)
  ).toEqual({
    ...CENSUS_DATASET,
    records: [],
  });
});

test("filtering does nothing to dataset with no records", async () => {
  expect(
    await uncheckedFilter(EMPTY_RECORDS, "true", jsEvalExpression)
  ).toEqual(EMPTY_RECORDS);
  expect(
    await uncheckedFilter(EMPTY_RECORDS, "false", jsEvalExpression)
  ).toEqual(EMPTY_RECORDS);
});

test("only includes cases for which predicate is true", async () => {
  expect(
    await uncheckedFilter(DATASET_A, "C > 2005", jsEvalExpression)
  ).toEqual({
    ...DATASET_A,
    records: makeRecords(
      ["A", "B", "C"],
      [
        [4, true, 2010],
        [10, false, 2014],
      ]
    ),
  });

  expect(
    await uncheckedFilter(
      DATASET_B,
      'Name == "Jon" || Name == "Eve"',
      jsEvalExpression
    )
  ).toEqual({
    ...DATASET_B,
    records: makeRecords(
      ["Name", "Birth_Year", "Current_Year", "Grade"],
      [
        ["Jon", 1990, 2021, 88],
        ["Eve", 2000, 2021, 93],
      ]
    ),
  });

  expect(
    await uncheckedFilter(CENSUS_DATASET, 'Sex == "Female"', jsEvalExpression)
  ).toEqual({
    ...CENSUS_DATASET,
    records: makeRecords(
      ["State", "sample", "Sex", "Age", "Year"],
      [
        ["Florida", 1, "Female", 16, 2017],
        ["Florida", 1, "Female", 52, 2017],
        ["California", 1, "Female", 22, 2017],
        ["California", 1, "Female", 48, 2017],
        ["Texas", 1, "Female", 18, 2017],
        ["Texas", 1, "Female", 47, 2017],
        ["Texas", 1, "Female", 20, 2017],
        ["Texas", 1, "Female", 4, 2017],
        ["South Carolina", 1, "Female", 27, 2017],
        ["South Carolina", 1, "Female", 38, 2017],
        ["Idaho", 1, "Female", 47, 2017],
        ["Massachusetts", 1, "Female", 64, 2017],
        ["Massachusetts", 1, "Female", 83, 2017],
      ]
    ),
  });
});

test("included cases appear in same order as input", async () => {
  const ordered = {
    collections: [makeCollection("Collection", ["Number"])],
    records: makeRecords(["Number"], [[1], [2], [3], [4], [5], [6], [7], [8]]),
  };

  expect(
    await uncheckedFilter(ordered, "Number % 2 == 0", jsEvalExpression)
  ).toEqual({
    ...ordered,
    records: makeRecords(["Number"], [[2], [4], [6], [8]]),
  });
});

test("all attribute metadata is copied", async () => {
  expect(
    await uncheckedFilter(DATASET_WITH_META, "true", jsEvalExpression)
  ).toEqual(DATASET_WITH_META);
});

test("errors when predicate evaluates to non-boolean", async () => {
  const nonBooleanErr = /evaluates to a boolean/;
  expect.assertions(5);

  try {
    await uncheckedFilter(DATASET_B, "100", jsEvalExpression);
  } catch (e) {
    expect(e.message).toMatch(nonBooleanErr);
  }

  try {
    await uncheckedFilter(TYPES_DATASET, "String", jsEvalExpression);
  } catch (e) {
    expect(e.message).toMatch(nonBooleanErr);
  }

  try {
    await uncheckedFilter(TYPES_DATASET, "Boundary", jsEvalExpression);
  } catch (e) {
    expect(e.message).toMatch(nonBooleanErr);
  }

  try {
    await uncheckedFilter(TYPES_DATASET, "Color", jsEvalExpression);
  } catch (e) {
    expect(e.message).toMatch(nonBooleanErr);
  }

  try {
    await uncheckedFilter(TYPES_DATASET, "Missing", jsEvalExpression);
  } catch (e) {
    expect(e.message).toMatch(nonBooleanErr);
  }
});
