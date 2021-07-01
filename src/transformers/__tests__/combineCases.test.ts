import { uncheckedCombineCases } from "../combineCases";
import { DATASET_A, DATASET_B, cloneDataSet } from "./data";

test("throws error combining datasets with non-shared attributes", () => {
  expect(() => uncheckedCombineCases(DATASET_A, DATASET_B)).toThrowError(/must have the same attribute names/);
});

test("combining a dataset with itself works", () => {
  const combined = cloneDataSet(DATASET_B);
  combined.records = combined.records.concat(combined.records);

  expect(uncheckedCombineCases(DATASET_B, DATASET_B)).toStrictEqual(combined);
});
