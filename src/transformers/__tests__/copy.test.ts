import { uncheckedCopy } from "../copy";
import {
  DATASET_A,
  DATASET_B,
  DATASET_WITH_META,
  EMPTY_DATASET,
  FULLY_FEATURED_DATASET,
} from "./data";

test("copies simple datasets", () => {
  expect(uncheckedCopy(DATASET_A)).toEqual(DATASET_A);
  expect(uncheckedCopy(DATASET_B)).toEqual(DATASET_B);
});

test("copies empty dataset", () => {
  expect(uncheckedCopy(EMPTY_DATASET)).toEqual(EMPTY_DATASET);
});

test("copies fully-featured dataset", () => {
  expect(uncheckedCopy(FULLY_FEATURED_DATASET)).toEqual(FULLY_FEATURED_DATASET);
});

test("copy preserves collection/attribute metadata", () => {
  expect(uncheckedCopy(DATASET_WITH_META)).toEqual(DATASET_WITH_META);
});
