import { uncheckedSort } from "../sort";
import {
  cloneDataSet,
  DATASET_A,
  DATASET_B,
  EMPTY_RECORDS,
  jsEvalExpression,
  makeCollection,
  makeRecords,
  makeSimpleBoundary,
  TYPES_DATASET,
} from "./data";

test("no change to dataset with no records", async () => {
  expect(
    await uncheckedSort(
      EMPTY_RECORDS,
      "A",
      "any",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(EMPTY_RECORDS);
});

test("sorts numbers", async () => {
  // ascending order
  const sortedByAAscending = cloneDataSet(DATASET_A);
  sortedByAAscending.records.sort(
    (a, b) => (a["A"] as number) - (b["A"] as number)
  );

  expect(
    await uncheckedSort(DATASET_A, "A", "number", "ascending", jsEvalExpression)
  ).toEqual(sortedByAAscending);

  // descending order
  const sortedByADescending = cloneDataSet(DATASET_A);
  sortedByADescending.records.sort(
    (a, b) => (b["A"] as number) - (a["A"] as number)
  );

  expect(
    await uncheckedSort(
      DATASET_A,
      "A",
      "number",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByADescending);
});

test("sorts booleans", async () => {
  // descending is true before false
  const sortedByBDescending = cloneDataSet(DATASET_A);
  sortedByBDescending.records = makeRecords(
    ["A", "B", "C"],
    [
      [3, true, 2000],
      [8, true, 2003],
      [4, true, 2010],
      [10, false, 1998],
      [10, false, 2014],
    ]
  );
  expect(
    await uncheckedSort(
      DATASET_A,
      "B",
      "boolean",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByBDescending);

  // ascending is true before false
  const sortedByBAscending = cloneDataSet(DATASET_A);
  sortedByBAscending.records = makeRecords(
    ["A", "B", "C"],
    [
      [10, false, 1998],
      [10, false, 2014],
      [3, true, 2000],
      [8, true, 2003],
      [4, true, 2010],
    ]
  );
  expect(
    await uncheckedSort(
      DATASET_A,
      "B",
      "boolean",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedByBAscending);
});

test("sorts strings", async () => {
  const sortedByNameAscending = cloneDataSet(DATASET_B);
  sortedByNameAscending.records.sort((a, b) => {
    if (a === b) {
      return 0;
    } else {
      return a > b ? 1 : -1;
    }
  });

  expect(
    await uncheckedSort(
      DATASET_B,
      "Name",
      "string",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedByNameAscending);

  const sortedByNameDescending = cloneDataSet(DATASET_B);
  sortedByNameDescending.records.sort((a, b) => {
    if (a === b) {
      return 0;
    } else {
      return b > a ? 1 : -1;
    }
  });

  expect(
    await uncheckedSort(
      DATASET_B,
      "Name",
      "string",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedByNameDescending);
});

function sortStr(a: string, b: string): number {
  if (a === b) {
    return 0;
  } else if (a > b) {
    return 1;
  } else {
    return -1;
  }
}

test("sorts objects", async () => {
  const withObjects = {
    collections: [makeCollection("Collection", ["Boundaries"])],
    records: makeRecords(
      ["Boundaries"],
      [
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
        [makeSimpleBoundary(true)],
      ]
    ),
  };

  const sortedWithObjectsAsc = cloneDataSet(withObjects);
  sortedWithObjectsAsc.records.sort((a, b) => {
    const aStr = JSON.stringify(a["Boundaries"]);
    const bStr = JSON.stringify(b["Boundaries"]);
    return sortStr(aStr, bStr);
  });
  expect(
    await uncheckedSort(
      withObjects,
      "Boundaries",
      "boundary",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsAsc);

  const sortedWithObjectsDesc = cloneDataSet(withObjects);
  sortedWithObjectsDesc.records.sort((a, b) => {
    const aStr = JSON.stringify(a["Boundaries"]);
    const bStr = JSON.stringify(b["Boundaries"]);
    return sortStr(bStr, aStr);
  });
  expect(
    await uncheckedSort(
      withObjects,
      "Boundaries",
      "boundary",
      "descending",
      jsEvalExpression
    )
  ).toEqual(sortedWithObjectsDesc);

  // All the boundaries are the same in the TYPES_DATASET
  expect(
    await uncheckedSort(
      TYPES_DATASET,
      "Boundary",
      "boundary",
      "ascending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
  expect(
    await uncheckedSort(
      TYPES_DATASET,
      "Boundary",
      "boundary",
      "descending",
      jsEvalExpression
    )
  ).toEqual(TYPES_DATASET);
});

// type errors with expected key expression type
// ascending vs descending
// can sort objects, strings, booleans, numbers
// errors on key expression evaling to different types for diff cases
// sort stability?
