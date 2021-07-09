import { uncheckedCopyStructure } from "../copyStructure";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  cloneDataSet,
  EMPTY_DATASET,
} from "./data";

test("copy structure copies collections/attributes of datasets", () => {
  const { collections: collectionsA, records: recordsA } =
    uncheckedCopyStructure(cloneDataSet(DATASET_A));
  expect(collectionsA).toEqual(DATASET_A.collections);
  expect(recordsA).toEqual([]);

  const { collections: collectionsB, records: recordsB } =
    uncheckedCopyStructure(cloneDataSet(DATASET_B));
  expect(collectionsB).toEqual(DATASET_B.collections);
  expect(recordsB).toEqual([]);
});

test("copy structure copies empty dataset", () => {
  // It is a full copy, since the empty dataset has no records anyway.
  expect(uncheckedCopyStructure(cloneDataSet(EMPTY_DATASET))).toEqual(
    EMPTY_DATASET
  );
});

test("copy structure preserves collection/attribute metadata", () => {
  const { collections, records } = uncheckedCopyStructure(
    cloneDataSet(DATASET_WITH_META)
  );
  expect(collections).toEqual(DATASET_WITH_META.collections);
  expect(records).toEqual([]);
});
