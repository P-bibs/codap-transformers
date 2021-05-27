import {
  setDifferenceWithPredicate,
  intersectionWithPredicate,
  unionWithPredicate,
  symmetricDifferenceWithPredicate,
} from "../util";

test("set union works", () => {
  const arr1 = [1, 2, 3, 4, 5, 6];
  const arr2 = [2, 4, 6, 8, 10];
  expect(unionWithPredicate(arr1, arr2, (x, y) => x === y)).toEqual([
    1, 2, 3, 4, 5, 6, 8, 10,
  ]);
});

test("set intersection works", () => {
  const arr1 = [1, 2, 3, 4, 5, 6];
  const arr2 = [2, 4, 6, 8, 10];
  expect(intersectionWithPredicate(arr1, arr2, (x, y) => x === y)).toEqual([
    2, 4, 6,
  ]);
});

test("set difference works", () => {
  const arr1 = [1, 2, 3, 4, 5, 6];
  const arr2 = [2, 4, 6, 8, 10];
  expect(setDifferenceWithPredicate(arr1, arr2, (x, y) => x === y)).toEqual([
    1, 3, 5,
  ]);
  expect(setDifferenceWithPredicate(arr2, arr1, (x, y) => x === y)).toEqual([
    8, 10,
  ]);
});

test("set symmetric difference works", () => {
  const arr1 = [1, 2, 3, 4, 5, 6];
  const arr2 = [2, 4, 6, 8, 10];
  expect(
    symmetricDifferenceWithPredicate(arr1, arr2, (x, y) => x === y)
  ).toEqual([1, 3, 5, 8, 10]);
});
