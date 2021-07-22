import { uncheckedCombineCases } from "../combineCases";
import { eraseFormulas } from "../util";
import {
  DATASET_A,
  DATASET_B,
  cloneDataSet,
  FULLY_FEATURED_DATASET,
  DATASET_WITH_META,
  makeCollection,
  makeRecords,
  DATASET_A_SUBSET,
  DATASET_A_SUPERSET,
} from "./data";

test("throws error combining datasets with non-shared attributes", () => {
  expect(() => uncheckedCombineCases(DATASET_A, DATASET_B)).toThrowError(
    /must have the same attribute names/
  );
});

test("throws error combining datasets with subset of attributes", () => {
  expect(() => uncheckedCombineCases(DATASET_A, DATASET_A_SUBSET)).toThrowError(
    /must have the same attribute names/
  );
});
test("throws error combining datasets with superset of attributes", () => {
  expect(() =>
    uncheckedCombineCases(DATASET_A, DATASET_A_SUPERSET)
  ).toThrowError(/must have the same attribute names/);
});

test("combining a dataset with itself works", () => {
  const combined = cloneDataSet(DATASET_B);
  combined.records = combined.records.concat(combined.records);

  expect(
    uncheckedCombineCases(cloneDataSet(DATASET_B), cloneDataSet(DATASET_B))
  ).toEqual(combined);
});

test("combining with an empty dataset is the identity transform", () => {
  const emptied = cloneDataSet(FULLY_FEATURED_DATASET);
  emptied.records = [];

  expect(uncheckedCombineCases(emptied, FULLY_FEATURED_DATASET)).toEqual(
    FULLY_FEATURED_DATASET
  );
});

test("cases are appended in correct order", async () => {
  const firstHalf = {
    collections: [makeCollection("Collection", ["Number"])],
    records: makeRecords(["Number"], [[1], [2], [3]]),
  };
  const secondHalf = {
    collections: [makeCollection("Collection", ["Number"])],
    records: makeRecords(["Number"], [[4], [5], [6]]),
  };

  expect(await uncheckedCombineCases(firstHalf, secondHalf)).toEqual({
    collections: [makeCollection("Collection", ["Number"])],
    records: makeRecords(["Number"], [[1], [2], [3], [4], [5], [6]]),
  });
});

test("all attribute metadata is copied", async () => {
  const withoutFormulas = cloneDataSet(DATASET_WITH_META);
  withoutFormulas.collections.forEach((coll) =>
    eraseFormulas(coll.attrs || [])
  );
  expect(
    await uncheckedCombineCases(DATASET_WITH_META, DATASET_WITH_META)
  ).toEqual(withoutFormulas);
});
