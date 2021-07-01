import { uncheckedAverage } from "../average";
import { DATASET_A } from "./data";

test("averages small numbers", () => {
  expect(uncheckedAverage(DATASET_A, "A")).toStrictEqual(7);
});

test("averages larger numbers", () => {
  expect(uncheckedAverage(DATASET_A, "C")).toStrictEqual(2005);
});

test("errors on invalid attribute", () => {
  expect(() => uncheckedAverage(DATASET_A, "Not Here")).toThrowError(
    /Invalid attribute/
  );
});

test("errors on non-number values", () => {
  expect(() => uncheckedAverage(DATASET_A, "B")).toThrowError(
    /Expected number/
  );
});
