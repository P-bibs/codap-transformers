import { uncheckedCopyStructure } from "../copyStructure";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_DATASET,
  FULLY_FEATURED_DATASET,
} from "./data";

test("copies structure of simple datasets", () => {
  const { collections: collectionsA, records: recordsA } =
    uncheckedCopyStructure(DATASET_A);
  expect(collectionsA).toEqual(DATASET_A.collections);
  expect(recordsA).toEqual([]);

  const { collections: collectionsB, records: recordsB } =
    uncheckedCopyStructure(DATASET_B);
  expect(collectionsB).toEqual(DATASET_B.collections);
  expect(recordsB).toEqual([]);
});

test("copies structure of empty dataset", () => {
  // It is a full copy, since the empty dataset has no records anyway.
  expect(uncheckedCopyStructure(EMPTY_DATASET)).toEqual(EMPTY_DATASET);
});

test("copies structure of fully-featured dataset", () => {
  const { collections, records } = uncheckedCopyStructure(
    FULLY_FEATURED_DATASET
  );
  expect(collections).toEqual(FULLY_FEATURED_DATASET.collections);
  expect(records).toEqual([]);
});

test("preserves collection/attribute metadata", () => {
  const { collections, records } = uncheckedCopyStructure(DATASET_WITH_META);
  expect(collections).toEqual(DATASET_WITH_META.collections);
  expect(records).toEqual([]);
});
