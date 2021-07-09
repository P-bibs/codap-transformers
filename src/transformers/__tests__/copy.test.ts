import { uncheckedCopy } from "../copy";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  cloneDataSet,
  EMPTY_DATASET,
} from "./data";

test("copy copies datasets", () => {
  expect(uncheckedCopy(cloneDataSet(DATASET_A))).toEqual(DATASET_A);
  expect(uncheckedCopy(cloneDataSet(DATASET_B))).toEqual(DATASET_B);
});

test("copy copies empty dataset", () => {
  expect(uncheckedCopy(cloneDataSet(EMPTY_DATASET))).toEqual(EMPTY_DATASET);
});

test("copy preserves collection/attribute metadata", () => {
  expect(uncheckedCopy(cloneDataSet(DATASET_WITH_META))).toEqual(
    DATASET_WITH_META
  );
});
