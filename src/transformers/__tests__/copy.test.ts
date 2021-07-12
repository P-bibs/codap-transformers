import { uncheckedCopy } from "../copy";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  cloneDataSet,
  EMPTY_DATASET,
  FULLY_FEATURED_DATASET,
} from "./data";

test("copies simple datasets", () => {
  expect(uncheckedCopy(cloneDataSet(DATASET_A))).toEqual(DATASET_A);
  expect(uncheckedCopy(cloneDataSet(DATASET_B))).toEqual(DATASET_B);
});

test("copies empty dataset", () => {
  expect(uncheckedCopy(cloneDataSet(EMPTY_DATASET))).toEqual(EMPTY_DATASET);
});

test("copies fully-featured dataset", () => {
  expect(uncheckedCopy(cloneDataSet(FULLY_FEATURED_DATASET))).toEqual(
    FULLY_FEATURED_DATASET
  );
});

test("copy preserves collection/attribute metadata", () => {
  expect(uncheckedCopy(cloneDataSet(DATASET_WITH_META))).toEqual(
    DATASET_WITH_META
  );
});
